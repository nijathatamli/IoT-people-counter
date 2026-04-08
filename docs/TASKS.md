# Tasks

Hackathon duration: ~48 hours (May 1–3, 2026).  
Update the status column as you work. Keep this file current — it's our shared source of truth.

**Status key:** `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Phase 1 — Foundation (Hours 0–8)

*Goal: every module can run independently. No integration yet.*

### Setup & Data

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.1 | Create GitHub repo, branch structure, invite team | — | `[ ]` | |
| 1.2 | Copy `.env.example` → `.env`, confirm all can run the repo | All | `[ ]` | |
| 1.3 | Compile `data/stations.json` (25 stations, coordinates, line assignments) | Data | `[ ]` | Source: Wikipedia + OSM |
| 1.4 | Compile `data/network.json` (line topology, travel times) | Data | `[ ]` | Estimate travel times from metro.gov.az |
| 1.5 | Write `data/synthetic/generate.py` and produce `ridership.csv` | ML | `[ ]` | See ML_MODEL.md for schema |

### CV Module

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.6 | Set up CV directory, install Ultralytics, confirm YOLOv8n loads | CV | `[ ]` | `pip install ultralytics` |
| 1.7 | Write `detector.py` — wraps YOLO, returns list of bounding boxes | CV | `[ ]` | Person class only |
| 1.8 | Write `counter.py` — takes detections, returns count + density score | CV | `[ ]` | |
| 1.9 | Write `stream.py --mock` — generates synthetic detection events | CV | `[ ]` | Must match API payload schema |
| 1.10 | Unit tests for detector and counter | CV | `[ ]` | |

### ML Module

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.11 | Write `features.py` — cyclical encoding, station metadata merge | ML | `[ ]` | See ML_MODEL.md |
| 1.12 | Write `train.py` — XGBoost regressor, 80/20 split, saves `model.pkl` | ML | `[ ]` | |
| 1.13 | Write `model.py` — `.predict(station, hour, day)` and `.best_departure()` | ML | `[ ]` | |
| 1.14 | Run training, confirm MAE < 0.05 on test set | ML | `[ ]` | |
| 1.15 | Write `evaluate.py` — prints metrics, generates residual plot | ML | `[ ]` | For judges / demo |

### API — Skeleton

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.16 | Set up FastAPI project, health check endpoint at `GET /` | API | `[ ]` | |
| 1.17 | Implement `GET /stations` from `stations.json` | API | `[ ]` | |
| 1.18 | Implement `GET /network` from `network.json` | API | `[ ]` | |
| 1.19 | Define all Pydantic schemas in `schemas.py` | API | `[ ]` | Match API_SPEC.md exactly |

---

## Phase 2 — Integration (Hours 8–24)

*Goal: all modules talking to each other. Frontend shows real data.*

### API — Full implementation

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.1 | Implement `GET /live/{station_id}` — reads latest CV result from cache | API | `[ ]` | Use in-memory dict for hackathon |
| 2.2 | Implement `POST /internal/cv/{station_id}` — receives CV payloads | API | `[ ]` | |
| 2.3 | Implement `GET /predict` — calls ml.predict() | API | `[ ]` | |
| 2.4 | Implement `GET /predict/day` — all 24 hours for one station | API | `[ ]` | |
| 2.5 | Implement `GET /recommend` — calls ml.best_departure() | API | `[ ]` | |
| 2.6 | Implement `GET /stations/ranked` | API | `[ ]` | |
| 2.7 | Add CORS headers for frontend on localhost:3000 | API | `[ ]` | |
| 2.8 | Confirm all endpoints match API_SPEC.md exactly | API + all | `[ ]` | Cross-team review |

### CV → API integration

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.9 | Update `stream.py` to POST results to API every 3 seconds | CV | `[ ]` | Use requests or httpx |
| 2.10 | Test full loop: mock stream → API → verify `/live/{id}` updates | CV + API | `[ ]` | |

### Frontend — Core

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.11 | Set up React project, configure proxy to localhost:8000 | Frontend | `[ ]` | |
| 2.12 | Implement `Live Feed` tab — CV canvas simulation + station selector | Frontend | `[ ]` | Canvas logic from v2 prototype |
| 2.13 | Wire Live Feed to `GET /live/{station_id}` — real person count + score | Frontend | `[ ]` | Poll every 3s |
| 2.14 | Implement hourly chart from `GET /predict/day` | Frontend | `[ ]` | |
| 2.15 | Implement `Route Planner` tab — origin/dest selector + recommendation | Frontend | `[ ]` | Call `GET /recommend` |
| 2.16 | Implement `Station Intel` tab — ranked list from `GET /stations/ranked` | Frontend | `[ ]` | |
| 2.17 | Hour scrubber connected to API (passes `?hour=N` to predict endpoints) | Frontend | `[ ]` | |

---

## Phase 3 — Polish & Demo Prep (Hours 24–40)

*Goal: demo-ready. Judges can use it without guidance.*

### Robustness

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 3.1 | API returns sensible error messages for all edge cases | API | `[ ]` | See error codes in API_SPEC.md |
| 3.2 | Frontend handles API errors gracefully (no white screen) | Frontend | `[ ]` | Loading states, fallback text |
| 3.3 | CV mock mode starts reliably in docker-compose | CV | `[ ]` | |
| 3.4 | Test docker-compose cold start on a clean machine | All | `[ ]` | |

### Demo content

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 3.5 | Prepare 3 demo routes that tell a clear story (e.g. peak vs off-peak) | All | `[ ]` | 28 May→Gənclik at 8AM vs 10AM |
| 3.6 | Write 3-sentence pitch summary for judges (what, why, how) | — | `[ ]` | Pin in Slack |
| 3.7 | Prepare one-slide architecture diagram (export from ARCHITECTURE.md) | — | `[ ]` | |
| 3.8 | Rehearse demo flow: Live Feed → Route Planner → Recommendation → Intel | All | `[ ]` | Time it: must be <5 min |

### Quality

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 3.9 | Run evaluate.py and include model metrics in demo | ML | `[ ]` | Print MAE, R² during presentation |
| 3.10 | Remove all `console.log`, `print()` debug statements | All | `[ ]` | |
| 3.11 | Check README quick start is accurate | — | `[ ]` | Test on a fresh clone |

---

## Phase 4 — Buffer (Hours 40–48)

*Only start new features here if Phase 3 is fully complete.*

| # | Task | Owner | Status | Priority |
|---|------|-------|--------|----------|
| 4.1 | Add map view of all stations coloured by congestion | Frontend | `[ ]` | Nice to have |
| 4.2 | Fine-tune ML model with day-specific patterns (Cuma prayer time, etc.) | ML | `[ ]` | Nice to have |
| 4.3 | Add confidence intervals to ML predictions | ML | `[ ]` | Nice to have |
| 4.4 | Improve CV mock to simulate train arrival events (sudden count spike) | CV | `[ ]` | Nice to have |

---

## Dependency Map

Some tasks are blocked until others complete. Key dependencies:

```
1.3 stations.json ─────────────────────────────→ 1.7 detector
                   └──────────────────────────→ 1.11 features.py
                   └──────────────────────────→ 1.17 GET /stations
                   
1.5 ridership.csv ──────────────────────────→ 1.12 train.py

1.12 model.pkl ─────────────────────────────→ 2.3 GET /predict

2.1 GET /live + 2.2 POST /internal/cv ───────→ 2.9 CV→API loop
                                              └→ 2.13 Frontend wire-up

2.3–2.6 all API endpoints ──────────────────→ 2.12–2.16 all frontend features
```

**Critical path:** 1.3 → 1.5 → 1.12 → 2.3 → 2.15 (Route Planner demo)

Prioritise the critical path first. Everything else can be added later.

---

## Notes

- If a task is blocked (`[!]`), add a note in the table explaining why.
- Don't reassign tasks without telling the team first.
- If you finish early, pick up the next unstarted task in the current phase — don't jump ahead.
- Update this file directly in your branch and merge frequently so everyone sees progress.
