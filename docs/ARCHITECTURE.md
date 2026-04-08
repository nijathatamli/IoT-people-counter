# Architecture

## System Overview

BakıMove is composed of five independent modules that communicate over a shared internal API. This separation allows each module to be developed, tested, and deployed independently by different team members.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌────────────┐ │
│  │ Camera Feeds │  │  Metro/Bus   │  │  Historical   │  │  External  │ │
│  │ (RTSP/Mock)  │  │  Network     │  │  Ridership    │  │  Context   │ │
│  │ Platform,    │  │  (Static)    │  │  Data         │  │  Weather,  │ │
│  │ Wagon, Bus,  │  │              │  │               │  │  Events,   │ │
│  │ Waiting Area │  │              │  │               │  │  Calendar  │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  └─────┬──────┘ │
└─────────┼─────────────────┼──────────────────┼───────────────  ┼────────┘
          │                 │                   │                 │
┌─────────▼───────┐  ┌──────▼─────────┐  ┌─────▼──────────┐  ┌──▼───────────┐
│   CV MODULE     │  │  METRO/BUS     │  │   ML MODULE    │  │  SCRAPER     │
│                 │  │  NETWORK       │  │                │  │  MODULE      │
│ YOLOv8-nano     │  │  (data/)       │  │ Congestion     │  │              │
│ Person counting │  │                │  │ Predictor      │  │ Weather API  │
│ Multi-zone:     │  │ Station coords │  │ Travel Time    │  │ Events scrape│
│  - Platform     │  │ Line topology  │  │ Predictor      │  │ Calendar     │
│  - Wagon        │  │ Bus routes     │  │ Best-time &    │  │ metadata     │
│  - Bus          │  │ Interchange    │  │ best-mode      │  │              │
│  - Waiting area │  │ map            │  │ advisor        │  │              │
└────────┬────────┘  └──────┬─────────┘  └──────┬─────────┘  └──────┬──────┘
         │                  │                    │                    │
┌────────▼──────────────────▼────────────────────▼────────────────────▼─────┐
│                          FASTAPI BACKEND                                  │
│                                                                           │
│  /stations        — static station + network data                         │
│  /live/{id}       — current CV count + density (platform/wagon/bus/wait)  │
│  /predict         — ML congestion forecast for station × time             │
│  /predict/travel  — predicted travel time between two nodes               │
│  /recommend       — optimal departure window + mode for O→D route         │
│  /directions      — multi-criteria route (fastest/ease/least-transfers/   │
│                     most-walking)                                         │
│  /scraper/status  — current scraper data freshness                        │
└──────────────────────────────────┬────────────────────────────────────────┘
                                   │ JSON over HTTP
                           ┌───────▼────────┐
                           │  REACT FRONTEND │
                           │                 │
                           │  Live Feed tab  │
                           │  Route Planner  │
                           │  (multi-mode)   │
                           │  Station Intel  │
                           └─────────────────┘
```

---

## Module Responsibilities

### CV Module (`cv/`)

**Input:** Camera streams (RTSP URLs or mock video files) from four zone types
**Output:** JSON with person count, bounding boxes, confidence scores, zone type, timestamp
**Runs on:** Edge device at each station / on-board unit (or central server in mock mode)

The CV module is stateless. It processes frames independently and publishes results. It does not store video or images — only the detection metadata.

**Detection zones:**
- **Station platform** — overhead cameras counting passengers on the platform
- **Metro wagon** — in-car cameras estimating wagon occupancy
- **Bus interior** — on-board cameras estimating bus crowding
- **Waiting area** — cameras in station concourses and corridors

Each zone type has its own density calibration (different area sizes, max capacity thresholds). Zone configs live in `cv/zones/`.

Key classes:
- `Detector` — wraps YOLOv8 inference, filters to `person` class only
- `Counter` — aggregates detections into density estimate per zone type
- `StreamHandler` — manages RTSP connection, reconnect logic, frame buffering

In mock mode, `stream.py --mock` generates synthetic detection data following the congestion model to simulate realistic variation across all zone types.

### Scraper Module (`scraper/`)

**Input:** External web sources (weather APIs, event listings, calendar data)
**Output:** Structured JSON cached in `scraper/data/` and served to ML via internal API
**Runs on:** API server or dedicated worker, on a configurable schedule (default: every 15 min)

The scraper collects contextual features that improve ML predictions beyond what historical ridership data alone provides:
- **Weather** — temperature, precipitation, wind (from OpenWeatherMap or similar)
- **Events** — concerts, football matches, public holidays, large gatherings (scraped from local event sites)
- **Calendar metadata** — Ramadan, school term dates, national holidays, day type classification

Key files:
- `scraper.py` — orchestrator that runs all source scrapers
- `sources/` — per-source scraper implementations (weather.py, events.py, calendar.py)
- `scheduler.py` — cron-based scheduling for continuous scraping

### ML Module (`ml/`)

**Input:** Station ID, hour-of-day (0–23), day-of-week (0–6), plus scraper-enriched features (weather, events, calendar)
**Output:** Predicted congestion score (0.0–1.0), congestion label, best departure window, predicted travel time between nodes, recommended transport mode
**Runs on:** API server (inference is fast, ~1ms per model)

Three models:
1. **Congestion predictor** — predicts platform/wagon/bus load, enriched with scraper features
2. **Travel time predictor** (`travel_time.py`) — estimates travel duration between any two nodes based on time of day, weather, events, and historical patterns
3. **Best-time-and-mode advisor** — recommends optimal departure time AND whether to take metro or bus for a given O→D pair

The models are trained offline on synthetic data generated to match known Baku Metro ridership patterns (twin peaks, weekday/weekend split, per-station weights), augmented with scraper-sourced features. In production, they would retrain weekly on BakıKart tap data.

See [ML_MODEL.md](./ML_MODEL.md) for full model specification.

### API (`api/`)

**Framework:** FastAPI (Python)
**Serves:** CV results, ML predictions, scraper status, static metro/bus network data, multi-criteria routing
**Auth:** None required for hackathon demo

The API is the single integration point. The frontend talks only to the API — never directly to the CV, scraper, or ML modules.

The API includes a **multi-criteria route planner** (`router.py`) that computes routes with user-selectable modes:
- `fastest` — minimise total travel time (uses travel time predictor)
- `ease` — minimise congestion exposure along the route
- `least_transfers` — minimise line changes and mode switches
- `most_walking` — maximise walking segments for users who prefer it

### Frontend (`frontend/`)

**Framework:** React
**State:** Local component state (no Redux needed at this scale)
**API calls:** Polling every 3s for live data, on-demand for predictions and routing

The Route Planner tab exposes a mode selector (fastest / ease / least transfers / most walking) and supports metro + bus multi-modal routes.

---

## Data Flow: Live Feed

```
Camera (platform/wagon/bus/waiting) → StreamHandler → Detector (YOLOv8) → Counter
    → POST /internal/cv/{station_id}?zone=platform|wagon|bus|waiting
                                          ↓
Frontend polls GET /live/{station_id} every 3s ← API reads latest CV result per zone
```

## Data Flow: Scraper → ML

```
External sources (weather API, event sites, calendar)
    → Scraper module (scheduled every 15 min)
    → Cached in scraper/data/ as structured JSON
    → ML features.py merges scraper data into feature vector at inference time
```

## Data Flow: Route Recommendation

```
User selects origin + destination
    → Frontend calls GET /recommend?origin=28+May&dest=Koroğlu&day=2
    → API calls ml.predict(origin, hour, day) for all hours 5–23
    → Enriches predictions with scraper context (weather, events)
    → Finds minimum average congestion window
    → Returns optimal_hour, predicted_load, recommended_mode, reasoning
    → Frontend renders recommendation card
```

## Data Flow: Multi-Criteria Directions

```
User selects origin + destination + mode (fastest/ease/least_transfers/most_walking)
    → Frontend calls GET /directions?origin=X&dest=Y&mode=fastest
    → API router.py computes candidate routes (metro, bus, mixed)
    → For each route: ML travel_time model predicts duration, congestion model predicts load
    → Routes ranked by selected mode criterion
    → Returns ordered route list with steps, transfers, estimated time, congestion
    → Frontend renders route comparison
```

---

## Technology Choices

| Component | Technology | Why |
|-----------|------------|-----|
| CV inference | YOLOv8-nano (Ultralytics) | Fastest YOLO variant, runs on CPU, <10ms/frame |
| API framework | FastAPI | Fast, auto-generates OpenAPI docs, async support |
| ML model | scikit-learn / XGBoost | Sufficient for tabular time-series regression, easy to retrain |
| Frontend | React | Team familiarity, component model fits the tab-based UI |
| Web scraping | requests + BeautifulSoup | Lightweight, no browser automation needed |
| Data format | JSON over HTTP | Simple, debuggable, no WebSocket complexity for hackathon |
| Containerisation | Docker Compose | Single command to bring up all services |

---

## Deployment (Hackathon Demo)

All services run locally via Docker Compose. No external APIs are called — everything is self-contained.

```
Port 3000  → React frontend
Port 8000  → FastAPI backend
Port 8001  → CV module (internal only, not exposed)
Port 8002  → Scraper module (internal only, not exposed)
```

For the live demo, the CV module runs in mock mode, generating realistic detection data. The ML model runs from a pre-trained `model.pkl` included in the repo.

---

## Production Considerations (Post-Hackathon)

These are out of scope for the hackathon but worth noting for the judges:

- **CV edge deployment:** Each station camera connects to a Raspberry Pi 5 or Jetson Nano running the CV module. Only detection metadata (not video) is sent to a central server.
- **Data privacy:** No biometric data is collected. Person detections are anonymous counts only. Raw frames are never stored.
- **Model retraining:** Weekly automated retraining on BakıKart aggregated tap data (pending data-sharing agreement with AYNA).
- **Scale:** 25 stations × 2 platforms each = 50 camera feeds. FastAPI handles this comfortably with async I/O.
- **BakıKart integration:** The ML model improves significantly with real tap-in/tap-out counts. Architecture supports swapping the synthetic training data for real data without code changes.
