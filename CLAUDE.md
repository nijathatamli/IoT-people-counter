# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BakıMove is a metro intelligence platform for Baku's metro system, combining real-time CV-based passenger detection with ML congestion prediction. Built for the Data-Driven Solutions Hackathon 2026.

## Architecture

Four independent modules communicate over a shared FastAPI backend:

- **CV Module (`cv/`)** — YOLOv8-nano person detection from camera feeds, pushes counts to API via `POST /internal/cv/{station_id}`
- **ML Module (`ml/`)** — XGBoost congestion predictor trained on synthetic ridership data, provides `.predict(station, hour, day)` and `.best_departure(origin, dest, day)`
- **API (`api/`)** — FastAPI backend, single integration point between all modules. Frontend never talks directly to CV or ML
- **Frontend (`frontend/`)** — React dashboard with Live Feed, Route Planner, and Station Intel tabs. Polls API every 3s for live data

Data flows: Camera → CV → POST to API cache → Frontend polls GET /live. ML predictions served on-demand via GET /predict, /recommend.

## Build & Run Commands

### Docker (full stack)
```bash
docker-compose up
# Frontend: localhost:3000, API: localhost:8000, API docs: localhost:8000/docs
```

### Manual setup
```bash
# API
cd api && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# CV mock mode
cd cv && pip install -r requirements.txt && python stream.py --mock --station "28 May"

# ML training + demo
cd ml && pip install -r requirements.txt && python train.py && python model.py --demo

# Frontend
cd frontend && npm install && npm run dev
```

### Generate synthetic data
```bash
cd data/synthetic && python generate.py --stations ../stations.json --output ridership.csv --seed 42
```

### ML pipeline
```bash
cd ml
python features.py --input ../data/synthetic/ridership.csv --output features.parquet
python train.py --features features.parquet --output model.pkl
python evaluate.py --model model.pkl --features features.parquet
```

### Tests
```bash
# CV tests
pytest cv/tests/test_detector.py
pytest cv/tests/test_counter.py
python cv/tests/test_integration.py --mock

# CV benchmark
python cv/benchmark.py --model yolov8n.pt --frames 100
```

## Code Standards

### Python (CV, ML, API)
- Python 3.11+, formatter: **black**, linter: **ruff**
- Type hints on all function signatures
- Pre-commit hooks: `pip install pre-commit && pre-commit install`

### JavaScript (Frontend)
- ES2022+, no TypeScript, formatter: **prettier**
- Components: `PascalCase.jsx`, hooks: `use-name.js`

### Commit format
`type(scope): description` — types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore` — scopes: `cv`, `ml`, `api`, `frontend`, `data`, `docs`

## Key Technical Details

- CV confidence threshold: 0.45 (lower than default 0.5 for variable platform lighting)
- CV processes at 2 FPS — sufficient for crowd counting
- ML features use cyclical sin/cos encoding for hour (period 24) and day-of-week (period 7)
- ML feature vector: 25-dim station one-hot + 7 engineered features = 32 dimensions
- Congestion labels: Low (0–0.34), Moderate (0.35–0.59), High (0.60–0.79), Peak (0.80–1.00)
- If ML model unavailable, API falls back to an analytical twin-peak Gaussian curve (`fallback_load` in model.py)
- Each module has its own `requirements.txt` / `package.json`
- Static metro data lives in `data/stations.json` and `data/network.json` — these are the ground truth

## Environment Variables

Configured via `.env` at project root:
- `CV_MOCK_MODE=true` — set false for real RTSP streams
- `CV_CONFIDENCE_THRESHOLD=0.45`
- `ML_MODEL_PATH=./ml/model.pkl`
- `ML_RETRAIN_ON_START=false`
- `API_PORT=8000`
