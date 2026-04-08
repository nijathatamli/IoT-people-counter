# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BakıMove is a metro intelligence platform for Baku's metro system, combining real-time CV-based passenger detection with ML congestion prediction. Built for the Data-Driven Solutions Hackathon 2026.

## Architecture

Five independent modules communicate over a shared FastAPI backend:

- **CV Module (`cv/`)** — YOLOv8-nano person detection from camera feeds across station platforms, metro wagons, buses, and waiting areas. Pushes counts to API via `POST /internal/cv/{station_id}`
- **Scraper Module (`scraper/`)** — Continuously scrapes external context (weather, events, calendar metadata) and caches it for ML consumption. Runs on a configurable schedule
- **ML Module (`ml/`)** — Prediction framework with three models: congestion predictor, travel time predictor (node-to-node), and best-time-to-board advisor. Uses scraper-enriched features (weather, events, date context) alongside historical ridership data
- **API (`api/`)** — FastAPI backend, single integration point. Includes a multi-criteria route planner supporting fastest/ease/least-transfers/most-walking modes. Frontend never talks directly to CV, scraper, or ML
- **Frontend (`frontend/`)** — React dashboard with Live Feed, Route Planner (multi-criteria), and Station Intel tabs. Polls API every 3s for live data

Data flows:
- CV: Camera → CV → POST to API cache → Frontend polls GET /live
- Scraper: External sources → Scraper → cached data → ML features
- Routing: User selects mode (fastest/ease/least-transfers/most-walking) → API route planner → ML predictions → response

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

# Scraper
cd scraper && pip install -r requirements.txt && python scraper.py --once

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
`type(scope): description` — types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore` — scopes: `cv`, `ml`, `api`, `frontend`, `scraper`, `data`, `docs`

## Key Technical Details

- CV confidence threshold: 0.45 (lower than default 0.5 for variable platform lighting)
- CV processes at 2 FPS — sufficient for crowd counting
- CV covers 4 zone types: station platform, metro wagon, bus interior, waiting area — each with its own density calibration
- ML features use cyclical sin/cos encoding for hour (period 24) and day-of-week (period 7)
- ML feature vector: 25-dim station one-hot + 7 time/station features + scraper features (weather, events, calendar) — dimensions expand with scraper sources
- Travel time model predicts node-to-node duration using historical patterns + real-time scraper context
- Route planner modes: `fastest`, `ease` (least congestion), `least_transfers`, `most_walking`
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
- `SCRAPER_WEATHER_API_KEY=` — OpenWeatherMap key (optional for mock)
- `SCRAPER_EVENTS_URL=` — events calendar endpoint
- `SCRAPER_INTERVAL_MINUTES=15`
- `API_PORT=8000`
