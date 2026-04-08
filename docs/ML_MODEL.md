# ML Model — Congestion Predictor

## Problem Statement

Given a metro station and a time (hour-of-day + day-of-week), enriched with external context (weather, events, calendar), predict:
1. **Congestion score** — a normalised value 0.0–1.0 representing platform/wagon/bus density
2. **Congestion label** — Low / Moderate / High / Peak
3. **Travel time** — estimated minutes between any two nodes in the network
4. **Best departure window** — the hour in a given day that minimises congestion for a given origin→destination route
5. **Best transport mode** — whether metro or bus is the better option for a given route and time

This is a **regression problem** (predicting continuous scores and durations) with secondary classification outputs (labels, mode recommendations).

---

## Feature Set

### Input features (inference time)

**Core features (from ridership data):**

| Feature | Type | Range | Description |
|---------|------|-------|-------------|
| `station_id` | categorical | 25 values | One-hot encoded station identifier |
| `hour` | cyclical | 0–23 | Hour of day, encoded as sin/cos pair |
| `day_of_week` | cyclical | 0–6 | Day of week, encoded as sin/cos pair |
| `is_weekend` | binary | 0/1 | Derived from day_of_week |
| `station_weight` | float | 0.0–1.0 | Pre-computed centrality weight |
| `is_interchange` | binary | 0/1 | Whether the station serves multiple lines |

**Scraper-enriched features (from external context):**

| Feature | Type | Range | Description |
|---------|------|-------|-------------|
| `temperature_c` | float | -10–45 | Current/forecast temperature in Celsius |
| `precipitation` | binary | 0/1 | Rain or snow expected |
| `wind_speed_kmh` | float | 0–100 | Wind speed |
| `has_major_event` | binary | 0/1 | Concert, football match, large gathering nearby |
| `event_distance_km` | float | 0–50 | Distance from station to nearest active event |
| `is_holiday` | binary | 0/1 | National holiday or observance |
| `is_ramadan` | binary | 0/1 | Ramadan period (affects evening travel patterns) |
| `is_school_term` | binary | 0/1 | School in session (affects morning peak) |

### Cyclical encoding

Hours and days are periodic — hour 23 is adjacent to hour 0. We encode them as:
```python
hour_sin = sin(2π × hour / 24)
hour_cos = cos(2π × hour / 24)
dow_sin  = sin(2π × day  / 7)
dow_cos  = cos(2π × day  / 7)
```
This prevents the model from treating the distance between hour 23 and hour 0 as large.

### Feature vector (20+ dimensions)
```
[station_onehot × 25] + [hour_sin, hour_cos, dow_sin, dow_cos, is_weekend, station_weight, is_interchange]
+ [temperature_c, precipitation, wind_speed_kmh, has_major_event, event_distance_km, is_holiday, is_ramadan, is_school_term]
```

When scraper data is unavailable, scraper features default to neutral values (e.g., `temperature_c=20`, `precipitation=0`, `has_major_event=0`). The model gracefully degrades — scraper features improve accuracy but are not required.

---

## Model Architecture

### Model 1: Congestion Predictor (Gradient Boosted Regressor)

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

### Model 2: Travel Time Predictor (`travel_time.py`)

Predicts travel duration in minutes between any two nodes in the metro/bus network.

**Input features:** origin_id, dest_id, hour, day_of_week, plus scraper features (weather, events)
**Output:** predicted_travel_time_min (float)

Uses the same XGBoost architecture. Training data is derived from base travel times in `data/network.json` with time-of-day multipliers (peak hours add 15–30% delay) and weather/event impact factors.

```python
XGBRegressor(
    n_estimators=150,
    max_depth=4,
    learning_rate=0.05,
    random_state=42
)
```

### Model 3: Mode Advisor

Not a separate model — uses the congestion predictor and travel time predictor together to compare metro vs. bus for a given O→D pair and recommend the better option based on predicted congestion and travel time.

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
def best_departure(origin_id, dest_id, day_of_week, scraper_context=None):
    scores = {}
    for hour in range(5, 23):  # Metro operating hours
        o_score = model.predict(origin_id, hour, day_of_week, context=scraper_context)
        d_score = model.predict(dest_id, hour, day_of_week, context=scraper_context)
        scores[hour] = (o_score + d_score) / 2

    best_hour = min(scores, key=scores.get)

    # Compare metro vs bus for the best hour
    metro_time = travel_time_model.predict(origin_id, dest_id, best_hour, mode="metro")
    bus_time = travel_time_model.predict(origin_id, dest_id, best_hour, mode="bus")
    recommended_mode = "metro" if metro_time <= bus_time else "bus"

    return {
        "optimal_hour": best_hour,
        "predicted_load": scores[best_hour],
        "label": congestion_label(scores[best_hour]),
        "recommended_mode": recommended_mode,
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
├── model.py          # Congestion model class with .predict() and .best_departure()
├── travel_time.py    # Travel time prediction between nodes
├── train.py          # Training script (all models)
├── features.py       # Feature engineering (incl. scraper feature merging)
├── evaluate.py       # Evaluation script with metrics and plots
├── model.pkl         # Pre-trained congestion model (committed for demo)
├── travel_model.pkl  # Pre-trained travel time model (committed for demo)
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
