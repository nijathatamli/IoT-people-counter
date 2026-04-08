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
| 1.8 | Write `counter.py` — takes detections, returns count + density score per zone | CV | `[ ]` | Zones: platform, wagon, bus, waiting |
| 1.9 | Create `cv/zones/` — zone config JSONs with area_m2, max_density per zone type | CV | `[ ]` | See CV_MODULE.md for defaults |
| 1.10 | Write `stream.py --mock` — generates synthetic detection events for all zones | CV | `[ ]` | Must match API payload schema, `--zone` flag |
| 1.10a | Unit tests for detector and counter (all zone types) | CV | `[ ]` | |

### Scraper Module

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.11 | Set up `scraper/` directory, install deps (requests, beautifulsoup4) | Scraper | `[ ]` | |
| 1.12 | Write `sources/weather.py` — fetch weather from OpenWeatherMap | Scraper | `[ ]` | Free tier, 60 calls/min |
| 1.13 | Write `sources/events.py` — scrape local event listings | Scraper | `[ ]` | BeautifulSoup |
| 1.14 | Write `sources/calendar.py` — generate calendar metadata (holidays, Ramadan, school term) | Scraper | `[ ]` | No external calls needed |
| 1.15 | Write `scraper.py` — orchestrator that runs all source scrapers | Scraper | `[ ]` | `--once` for single run |
| 1.16 | Write `scheduler.py` — cron-based continuous scraping | Scraper | `[ ]` | Default: every 15 min |
| 1.17 | Unit tests for each scraper source | Scraper | `[ ]` | Mock external responses |

### ML Module

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.18 | Write `features.py` — cyclical encoding, station metadata merge, scraper feature merging | ML | `[ ]` | See ML_MODEL.md |
| 1.19 | Write `train.py` — XGBoost regressor, 80/20 split, saves `model.pkl` | ML | `[ ]` | |
| 1.20 | Write `model.py` — `.predict(station, hour, day, context)` and `.best_departure()` | ML | `[ ]` | context = scraper data |
| 1.21 | Write `travel_time.py` — travel time prediction between nodes | ML | `[ ]` | Uses network.json base times + multipliers |
| 1.22 | Run training, confirm MAE < 0.05 on test set | ML | `[ ]` | |
| 1.23 | Write `evaluate.py` — prints metrics, generates residual plot | ML | `[ ]` | For judges / demo |

### API — Skeleton

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.24 | Set up FastAPI project, health check endpoint at `GET /` | API | `[ ]` | |
| 1.25 | Implement `GET /stations` from `stations.json` | API | `[ ]` | |
| 1.26 | Implement `GET /network` from `network.json` | API | `[ ]` | |
| 1.27 | Define all Pydantic schemas in `schemas.py` | API | `[ ]` | Match API_SPEC.md exactly |

---

## Phase 2 — Integration (Hours 8–24)

*Goal: all modules talking to each other. Frontend shows real data.*

### API — Full implementation

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.1 | Implement `GET /live/{station_id}` — reads latest CV result from cache (all zones) | API | `[ ]` | Use in-memory dict, support `?zone=` param |
| 2.2 | Implement `POST /internal/cv/{station_id}` — receives CV payloads with zone type | API | `[ ]` | |
| 2.3 | Implement `GET /predict` — calls ml.predict() with scraper context | API | `[ ]` | |
| 2.4 | Implement `GET /predict/day` — all 24 hours for one station | API | `[ ]` | |
| 2.5 | Implement `GET /predict/travel` — travel time between two nodes | API | `[ ]` | Calls travel_time.py |
| 2.6 | Implement `GET /recommend` — calls ml.best_departure(), includes mode recommendation | API | `[ ]` | |
| 2.7 | Implement `GET /directions` — multi-criteria route planner | API | `[ ]` | Modes: fastest, ease, least_transfers, most_walking |
| 2.8 | Write `router.py` — route computation logic (graph traversal, mode comparison) | API | `[ ]` | Uses network.json + bus_routes.json |
| 2.9 | Implement `GET /stations/ranked` | API | `[ ]` | |
| 2.10 | Implement `GET /scraper/status` — scraper data freshness | API | `[ ]` | |
| 2.11 | Add CORS headers for frontend on localhost:3000 | API | `[ ]` | |
| 2.12 | Confirm all endpoints match API_SPEC.md exactly | API + all | `[ ]` | Cross-team review |

### CV → API integration

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.13 | Update `stream.py` to POST results to API every 3 seconds (all zones) | CV | `[ ]` | Use requests or httpx |
| 2.14 | Test full loop: mock stream → API → verify `/live/{id}` updates per zone | CV + API | `[ ]` | |

### Scraper → ML integration

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.15 | Wire scraper output into ML `features.py` — merge weather/events/calendar into feature vector | ML + Scraper | `[ ]` | |
| 2.16 | Test ML predictions with and without scraper data — confirm graceful degradation | ML | `[ ]` | |
| 2.17 | Wire `GET /scraper/status` to show data freshness in frontend | Frontend + API | `[ ]` | |

### Frontend — Core

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.18 | Set up React project, configure proxy to localhost:8000 | Frontend | `[ ]` | |
| 2.19 | Implement `Live Feed` tab — CV canvas simulation + station selector + zone tabs | Frontend | `[ ]` | Show platform/wagon/bus/waiting zones |
| 2.20 | Wire Live Feed to `GET /live/{station_id}` — real person count + score per zone | Frontend | `[ ]` | Poll every 3s |
| 2.21 | Implement hourly chart from `GET /predict/day` | Frontend | `[ ]` | |
| 2.22 | Implement `Route Planner` tab — origin/dest selector + mode selector (fastest/ease/least_transfers/most_walking) | Frontend | `[ ]` | Call `GET /directions` |
| 2.23 | Implement route comparison view — show ranked routes with steps, time, congestion | Frontend | `[ ]` | |
| 2.24 | Implement recommendation card from `GET /recommend` — includes mode suggestion | Frontend | `[ ]` | |
| 2.25 | Implement `Station Intel` tab — ranked list from `GET /stations/ranked` | Frontend | `[ ]` | |
| 2.26 | Hour scrubber connected to API (passes `?hour=N` to predict endpoints) | Frontend | `[ ]` | |
| 2.27 | Show scraper context (weather, events) in UI where relevant | Frontend | `[ ]` | Small badge/indicator |

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
| 3.5 | Prepare 3 demo routes that tell a clear story (e.g. peak vs off-peak, rain vs clear, event day) | All | `[ ]` | Show mode comparison: fastest vs ease |
| 3.6 | Write 3-sentence pitch summary for judges (what, why, how) | — | `[ ]` | Pin in Slack |
| 3.7 | Prepare one-slide architecture diagram (export from ARCHITECTURE.md) | — | `[ ]` | Include scraper module |
| 3.8 | Rehearse demo flow: Live Feed (zones) → Route Planner (modes) → Recommendation → Intel | All | `[ ]` | Time it: must be <5 min |

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
| 4.5 | Add bus route data to `data/bus_routes.json` with real BakuBus routes | Data | `[ ]` | Nice to have |
| 4.6 | Scraper: add more event sources (Telegram channels, social media) | Scraper | `[ ]` | Nice to have |
| 4.7 | Show weather + event context as overlay on route planner map | Frontend | `[ ]` | Nice to have |

---

## Dependency Map

Some tasks are blocked until others complete. Key dependencies:

```
1.3 stations.json ─────────────────────────────→ 1.7 detector
                   └──────────────────────────→ 1.18 features.py
                   └──────────────────────────→ 1.25 GET /stations

1.5 ridership.csv ──────────────────────────→ 1.19 train.py

1.11–1.16 scraper module ──────────────────→ 2.15 scraper→ML integration
                                            └→ 1.18 features.py (scraper features)

1.19 model.pkl ─────────────────────────────→ 2.3 GET /predict
1.21 travel_model.pkl ─────────────────────→ 2.5 GET /predict/travel
                                            └→ 2.7 GET /directions

2.1 GET /live + 2.2 POST /internal/cv ─────→ 2.13 CV→API loop
                                            └→ 2.20 Frontend wire-up

2.7 GET /directions + 2.8 router.py ───────→ 2.22 Route Planner frontend

2.3–2.10 all API endpoints ────────────────→ 2.18–2.27 all frontend features
```

**Critical path:** 1.3 → 1.5 → 1.19 → 2.3 → 2.7 → 2.22 (Multi-criteria Route Planner demo)

**Secondary path:** 1.11 → 1.15 → 2.15 → 2.3 (Scraper-enriched predictions)

Prioritise the critical path first. Everything else can be added later.

---

## Notes

- If a task is blocked (`[!]`), add a note in the table explaining why.
- Don't reassign tasks without telling the team first.
- If you finish early, pick up the next unstarted task in the current phase — don't jump ahead.
- Update this file directly in your branch and merge frequently so everyone sees progress.
