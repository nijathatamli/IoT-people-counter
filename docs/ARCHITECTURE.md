# Architecture

## System Overview

BakıMove is composed of four independent modules that communicate over a shared internal API. This separation allows each module to be developed, tested, and deployed independently by different team members.

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Camera Feed  │    │  Metro Net   │    │  Historical      │  │
│  │ (RTSP/Mock)  │    │  (Static)    │    │  Ridership Data  │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
└─────────┼────────────────── ┼─────────────────────┼────────────┘
          │                   │                      │
┌─────────▼───────┐  ┌────────▼──────────┐  ┌───────▼──────────┐
│   CV MODULE     │  │   METRO NETWORK   │  │   ML MODULE      │
│                 │  │   (data/stations  │  │                  │
│ YOLOv8-nano     │  │    .json)         │  │ Congestion       │
│ Person counting │  │                   │  │ Predictor        │
│ Density est.    │  │ Station coords    │  │ Best-time model  │
└────────┬────────┘  │ Line topology     │  └───────┬──────────┘
         │           │ Interchange map   │          │
         │           └────────┬──────────┘          │
         │                    │                      │
┌────────▼────────────────────▼──────────────────────▼──────────┐
│                        FASTAPI BACKEND                         │
│                                                                │
│  /stations     — static station + network data                 │
│  /live/{id}    — current CV count + density for a station      │
│  /predict      — ML congestion forecast for station × time     │
│  /recommend    — optimal departure window for O→D route        │
└────────────────────────────────┬───────────────────────────────┘
                                 │ JSON over HTTP
                         ┌───────▼────────┐
                         │  REACT FRONTEND │
                         │                │
                         │  Live Feed tab  │
                         │  Route Planner  │
                         │  Station Intel  │
                         └────────────────┘
```

---

## Module Responsibilities

### CV Module (`cv/`)

**Input:** Camera stream (RTSP URL or mock video file)  
**Output:** JSON with person count, bounding boxes, confidence scores, timestamp  
**Runs on:** Edge device at each station (or central server in mock mode)

The CV module is stateless. It processes frames independently and publishes results. It does not store video or images — only the detection metadata.

Key classes:
- `Detector` — wraps YOLOv8 inference, filters to `person` class only
- `Counter` — aggregates detections into platform density estimate
- `StreamHandler` — manages RTSP connection, reconnect logic, frame buffering

In mock mode, `stream.py --mock` generates synthetic detection data following the congestion model to simulate realistic variation.

### ML Module (`ml/`)

**Input:** Station ID, hour-of-day (0–23), day-of-week (0–6)  
**Output:** Predicted congestion score (0.0–1.0), congestion label, best departure window  
**Runs on:** API server (inference is fast, ~1ms)

The model is trained offline on synthetic data generated to match known Baku Metro ridership patterns (twin peaks, weekday/weekend split, per-station weights). In production, it would retrain weekly on BakıKart tap data.

See [ML_MODEL.md](./ML_MODEL.md) for full model specification.

### API (`api/`)

**Framework:** FastAPI (Python)  
**Serves:** CV results, ML predictions, static metro network data  
**Auth:** None required for hackathon demo

The API is the single integration point. The frontend talks only to the API — never directly to the CV or ML modules.

### Frontend (`frontend/`)

**Framework:** React  
**State:** Local component state (no Redux needed at this scale)  
**API calls:** Polling every 3s for live data, on-demand for predictions

---

## Data Flow: Live Feed

```
Camera → StreamHandler → Detector (YOLOv8) → Counter → POST /internal/cv/{station_id}
                                                              ↓
Frontend polls GET /live/{station_id} every 3s ← API reads latest CV result
```

## Data Flow: Route Recommendation

```
User selects origin + destination
    → Frontend calls GET /recommend?origin=28+May&dest=Koroğlu&day=2
    → API calls ml.predict(origin, hour, day) for all hours 5–23
    → Finds minimum average congestion window
    → Returns optimal_hour, predicted_load, reasoning
    → Frontend renders recommendation card
```

---

## Technology Choices

| Component | Technology | Why |
|-----------|------------|-----|
| CV inference | YOLOv8-nano (Ultralytics) | Fastest YOLO variant, runs on CPU, <10ms/frame |
| API framework | FastAPI | Fast, auto-generates OpenAPI docs, async support |
| ML model | scikit-learn / XGBoost | Sufficient for tabular time-series regression, easy to retrain |
| Frontend | React | Team familiarity, component model fits the tab-based UI |
| Data format | JSON over HTTP | Simple, debuggable, no WebSocket complexity for hackathon |
| Containerisation | Docker Compose | Single command to bring up all services |

---

## Deployment (Hackathon Demo)

All services run locally via Docker Compose. No external APIs are called — everything is self-contained.

```
Port 3000  → React frontend
Port 8000  → FastAPI backend
Port 8001  → CV module (internal only, not exposed)
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
