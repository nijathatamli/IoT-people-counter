# BakıMove — Metro Intelligence Platform

> Real-time passenger congestion detection and ML-powered travel time recommendations for the Bakı Metropoliteni.

Built for the **Data-Driven Solutions Hackathon 2026**.

---

## What It Does

BakıMove addresses a real gap in Baku's transit infrastructure: passengers have no way to know how crowded a metro station, train, or bus is before they arrive — and no tool to plan routes that balance speed, comfort, and transfers. We solve this with five components working together:

**1. Congestion Detection (Computer Vision)**
Camera feeds from metro station platforms, inside metro wagons, bus interiors, and station waiting areas are processed in real time using YOLOv8-nano to count passengers and estimate density. Inference runs on edge hardware — no raw video leaves the premises.

**2. Web Scraper — External Context Engine**
A scraper module continuously collects real-world context that affects transit demand: upcoming events (concerts, football matches, public holidays), weather forecasts, and calendar metadata (date, time, day of week, Ramadan, school term). This data feeds directly into the ML model as input features, improving prediction accuracy beyond what historical ridership alone can achieve.

**3. ML Prediction Framework**
An ensemble of ML models powered by scraper-enriched features:
- **Congestion predictor** — predicts platform/wagon load for any station at any time, factoring in weather, events, and historical patterns.
- **Travel time predictor** — estimates travel time between any two nodes in the network based on current conditions, time of day, and external factors from the scraper.
- **Best-time-to-board advisor** — recommends the optimal departure time AND which transport mode to take (metro vs. bus) to minimise congestion exposure.

**4. Multi-Criteria Route Planner**
Directions to any destination with user-selectable routing modes:
- **Fastest path** — minimises total travel time
- **Ease path** — minimises congestion exposure (least crowded route)
- **Least transfers** — minimises the number of line changes / mode switches
- **Most walking** — maximises walking segments (for users who prefer to walk parts of the route)
- Routes can combine metro + bus segments when beneficial.

**5. Real-Time Dashboard**
A React frontend with Live Feed (CV detections), Route Planner (multi-criteria directions), and Station Intel (ranked congestion across all stations).

---

## Repository Structure

```
bakimove/
├── cv/                   # Computer vision module (YOLOv8 inference pipeline)
│   ├── detector.py       # Main detection class
│   ├── counter.py        # Person counting and density estimation
│   ├── stream.py         # Camera stream handler (RTSP / mock)
│   └── zones/            # Zone configs for wagons, buses, waiting areas
├── scraper/              # Web scraper — external context engine
│   ├── scraper.py        # Main scraper orchestrator
│   ├── sources/          # Per-source scrapers (weather, events, calendar)
│   ├── scheduler.py      # Cron-based scrape scheduling
│   └── data/             # Cached scraped data
├── ml/                   # ML prediction framework
│   ├── model.py          # Congestion predictor (inference)
│   ├── travel_time.py    # Travel time prediction between nodes
│   ├── train.py          # Training script (all models)
│   ├── features.py       # Feature engineering (incl. scraper features)
│   └── data/             # Synthetic + scraped training data
├── api/                  # FastAPI backend
│   ├── main.py           # App entrypoint
│   ├── routes/           # Route handlers
│   ├── router.py         # Multi-criteria route planner logic
│   └── schemas.py        # Pydantic models
├── frontend/             # React dashboard
│   ├── src/
│   └── public/
├── data/                 # Static metro + bus network data
│   ├── stations.json     # Station list with coordinates
│   ├── network.json      # Line topology + bus routes
│   └── bus_routes.json   # Bus network data
├── docs/                 # Project documentation
└── docker-compose.yml    # Full stack local setup
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker + Docker Compose (optional but recommended)

### Option A — Docker (recommended)

```bash
git clone https://github.com/your-team/bakimove
cd bakimove
docker-compose up
```

Frontend: http://localhost:3000  
API: http://localhost:8000  
API docs: http://localhost:8000/docs

### Option B — Manual

**Backend:**
```bash
cd api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**CV module (mock mode):**
```bash
cd cv
pip install -r requirements.txt
python stream.py --mock --station "28 May"
```

**ML model:**
```bash
cd ml
python train.py          # generates model.pkl from synthetic data
python model.py --demo   # runs inference demo
```

**Scraper:**
```bash
cd scraper
pip install -r requirements.txt
python scraper.py --once          # single scrape run
python scheduler.py               # continuous scheduled scraping
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file at the project root:

```env
# API
API_PORT=8000
API_HOST=0.0.0.0

# CV
CV_MOCK_MODE=true           # Set false to use real RTSP streams
CV_CONFIDENCE_THRESHOLD=0.45
CV_MODEL_PATH=./cv/weights/yolov8n.pt

# ML
ML_MODEL_PATH=./ml/model.pkl
ML_RETRAIN_ON_START=false

# Scraper
SCRAPER_WEATHER_API_KEY=         # OpenWeatherMap API key (optional for mock)
SCRAPER_EVENTS_URL=              # Events calendar endpoint
SCRAPER_INTERVAL_MINUTES=15      # Scrape frequency

# Data
DATA_PATH=./data
```

---

## Team

| Name | Role | Contact |
|------|------|---------|
| TBD | CV / ML Lead | — |
| TBD | Backend Lead | — |
| TBD | Frontend Lead | — |
| TBD | Data / Research | — |

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and component relationships |
| [DATA_SOURCES.md](./DATA_SOURCES.md) | Data availability, sourcing strategy, mock data |
| [ML_MODEL.md](./ML_MODEL.md) | Model design, features, training, evaluation |
| [CV_MODULE.md](./CV_MODULE.md) | Computer vision pipeline specification |
| [API_SPEC.md](./API_SPEC.md) | Internal API contracts between all modules |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Git workflow, code standards, PR process |
| [TASKS.md](./TASKS.md) | Sprint tasks with ownership and status |

---

## Hackathon Context

- **Event:** Data-Driven Solutions Hackathon 2026
- **Challenge track:** Urban Mobility / Smart City
- **Duration:** ~48 hours
- **Judging criteria:** Data use, technical depth, real-world applicability, demo quality

The demo runs entirely on synthetic data modelled on real Baku Metro ridership patterns. See [DATA_SOURCES.md](./DATA_SOURCES.md) for the sourcing strategy and what a production deployment would require.
