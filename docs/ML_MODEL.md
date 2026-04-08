# ML Model — Congestion Predictor

## Problem Statement

Given a metro station and a time (hour-of-day + day-of-week), predict:
1. **Congestion score** — a normalised value 0.0–1.0 representing platform density
2. **Congestion label** — Low / Moderate / High / Peak
3. **Best departure window** — the hour in a given day that minimises congestion for a given origin→destination route

This is a **regression problem** (predicting a continuous score) with a secondary classification output (the label).

---

## Feature Set

### Input features (inference time)

| Feature | Type | Range | Description |
|---------|------|-------|-------------|
| `station_id` | categorical | 25 values | One-hot encoded station identifier |
| `hour` | cyclical | 0–23 | Hour of day, encoded as sin/cos pair |
| `day_of_week` | cyclical | 0–6 | Day of week, encoded as sin/cos pair |
| `is_weekend` | binary | 0/1 | Derived from day_of_week |
| `station_weight` | float | 0.0–1.0 | Pre-computed centrality weight |
| `is_interchange` | binary | 0/1 | Whether the station serves multiple lines |

### Cyclical encoding

Hours and days are periodic — hour 23 is adjacent to hour 0. We encode them as:
```python
hour_sin = sin(2π × hour / 24)
hour_cos = cos(2π × hour / 24)
dow_sin  = sin(2π × day  / 7)
dow_cos  = cos(2π × day  / 7)
```
This prevents the model from treating the distance between hour 23 and hour 0 as large.

### Feature vector (12 dimensions)
```
[station_onehot × 25] + [hour_sin, hour_cos, dow_sin, dow_cos, is_weekend, station_weight, is_interchange]
```

---

## Model Architecture

### Primary model: Gradient Boosted Regressor

We use **XGBoost** for the congestion score regression.

**Why XGBoost over a neural network:**
- Training data is tabular, not sequential — tree models match this structure well
- Interpretable feature importance is useful for the hackathon pitch
- Fast inference (~1ms) with no GPU required
- No risk of overfitting on a small synthetic dataset

**Hyperparameters (baseline):**
```python
XGBRegressor(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)
```

### Fallback model: Analytical curve

If the trained model is unavailable, the API falls back to a parametric hourly load function:

```python
def fallback_load(hour, station_weight=0.7, day_factor=1.0):
    """Piecewise Gaussian mixture approximating twin-peak metro pattern."""
    morning = 0.9 * exp(-((hour - 8.0)**2) / (2 * 1.2**2))
    evening = 0.93 * exp(-((hour - 18.0)**2) / (2 * 1.0**2))
    base = 0.12
    return min(1.0, (max(morning, evening) + base) * station_weight * day_factor)
```

This is what the frontend demo uses. It produces realistic-looking curves and is sufficient for the hackathon pitch.

---

## Training Pipeline

### 1. Data generation

```bash
cd data/synthetic
python generate.py --output ridership.csv --seed 42
```

Generates 8,760 rows (25 stations × 365 days × 24 hours = 219,000 rows with per-hour granularity).

### 2. Feature engineering

```bash
cd ml
python features.py --input ../data/synthetic/ridership.csv --output features.parquet
```

Applies cyclical encoding, merges station metadata, outputs feature matrix.

### 3. Training

```bash
python train.py --features features.parquet --output model.pkl
```

Splits 80/20 train/test. Saves model + scaler to `model.pkl`.

### 4. Evaluation

```bash
python evaluate.py --model model.pkl --features features.parquet
```

Outputs:
- MAE, RMSE, R² on held-out test set
- Per-station error breakdown
- Hour-of-day residual plot (should be symmetric)

### Target metrics

| Metric | Target | Why |
|--------|--------|-----|
| MAE | < 0.05 | Within 5 percentage points of actual congestion |
| R² | > 0.90 | Model explains >90% of variance |
| Inference latency | < 5ms | Real-time API responsiveness |

---

## Best Departure Window Algorithm

Given an origin station O and destination station D, we find the hour with the lowest predicted average congestion:

```python
def best_departure(origin_id, dest_id, day_of_week):
    scores = {}
    for hour in range(5, 23):  # Metro operating hours
        o_score = model.predict(origin_id, hour, day_of_week)
        d_score = model.predict(dest_id, hour, day_of_week)
        scores[hour] = (o_score + d_score) / 2
    
    best_hour = min(scores, key=scores.get)
    return {
        "optimal_hour": best_hour,
        "predicted_load": scores[best_hour],
        "label": congestion_label(scores[best_hour]),
        "all_hours": scores   # for the frontend chart
    }
```

**Why average O + D, not just O:**
A passenger arrives at D as well. If the origin is quiet but the destination is packed, the journey experience is still bad.

**Future improvement:** Weight the origin station more heavily during commute direction (e.g. in morning peak, origin congestion matters more for inbound trips).

---

## Congestion Labels

| Score | Label | Description |
|-------|-------|-------------|
| 0.00 – 0.34 | Low | Comfortable, seats available |
| 0.35 – 0.59 | Moderate | Platform has some crowds, trains filling |
| 0.60 – 0.79 | High | Crowded platform, may need to wait for next train |
| 0.80 – 1.00 | Peak | Maximum congestion, significant delays likely |

---

## Model Files

```
ml/
├── model.py          # Model class with .predict() and .best_departure() methods
├── train.py          # Training script
├── features.py       # Feature engineering functions
├── evaluate.py       # Evaluation script with metrics and plots
├── model.pkl         # Pre-trained model (committed to repo for demo)
└── requirements.txt  # xgboost, scikit-learn, pandas, numpy, joblib
```

---

## Extending the Model (Post-Hackathon)

### With real BakıKart data
Replace synthetic `ridership.csv` with aggregated tap-in/tap-out counts per station per 15-minute window. Features and model architecture stay the same. Expected R² improvement to >0.95.

### Incorporating CV feedback
Once the CV module runs live, feed its real-time counts back as a correction signal:

```
predicted_score = model.predict(station, hour, day)
cv_count = cv_module.get_count(station)
corrected_score = 0.7 × predicted_score + 0.3 × normalise(cv_count)
```

This hybrid approach is robust: if CV fails (camera offline), prediction still works.

### Sequential model
If enough historical CV data accumulates, upgrade to an LSTM or Temporal Fusion Transformer for sequence-aware prediction. Not needed for the hackathon.
