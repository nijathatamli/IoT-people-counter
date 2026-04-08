# BakıMove — Metro Intelligence Platform

> Real-time passenger congestion detection and ML-powered travel time recommendations for the Bakı Metropoliteni.

Built for the **Data-Driven Solutions Hackathon 2026**.

---

## What It Does

BakıMove addresses a real gap in Baku's transit infrastructure: passengers have no way to know how crowded a metro station or train is before they arrive. We solve this with two components working together:

**1. Computer Vision Passenger Detection**
Camera feeds at each platform are processed in real time using YOLOv8-nano to count passengers and estimate platform density. Inference runs on edge hardware at the station — no raw video leaves the premises.

**2. ML Congestion Prediction**
A trained regression model predicts platform load for any station at any time of day, using historical patterns derived from ridership data. It surfaces a "best time to travel" recommendation per route that minimises congestion exposure.

---

## Repository Structure

```
bakimove/
├── cv/                   # Computer vision module (YOLOv8 inference pipeline)
│   ├── detector.py       # Main detection class
│   ├── counter.py        # Person counting and density estimation
│   └── stream.py         # Camera stream handler (RTSP / mock)
├── ml/                   # Congestion prediction model
│   ├── model.py          # Model definition and inference
│   ├── train.py          # Training script
│   ├── features.py       # Feature engineering
│   └── data/             # Synthetic training data
├── api/                  # FastAPI backend
│   ├── main.py           # App entrypoint
│   ├── routes/           # Route handlers
│   └── schemas.py        # Pydantic models
├── frontend/             # React dashboard
│   ├── src/
│   └── public/
├── data/                 # Static metro network data
│   ├── stations.json     # Station list with coordinates
│   └── network.json      # Line topology
├── docs/                 # Project documentation (this folder)
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
