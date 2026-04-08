# Data Sources

## Summary

Baku has no publicly available GTFS feed, no open transit API, and no GBFS micromobility data. This document describes what data exists, where to get it, our strategy for the hackathon, and what a production system would require.

---

## Metro Network (Static Topology)

### What we need
Station names, coordinates, line assignments, interchange relationships.

### Status: ✅ Available — manually compiled

The Baku Metro has **3 lines, 25 stations** (as of 2026):

| Line | Colour | Stations | Length |
|------|--------|----------|--------|
| Line 1 | Red | İçərişəhər → Hövsan (14 stations) | 20.1 km |
| Line 2 | Green | Dərnəgül → Həzi Aslanov (6 stations) | 25.7 km |
| Line 3 | Purple | Avtovağzal → 28 May (3 stations) | ~5 km |

**Source for station data:**
- Official site: https://metro.gov.az/en (station list, no structured data)
- Wikipedia: https://en.wikipedia.org/wiki/Baku_Metro (coordinates, line assignments)
- OpenStreetMap Overpass API: relations 456667 (Green), 456668 (Red)

**How to extract from OSM:**
```bash
# Fetch metro station nodes for Baku
curl "https://overpass-api.de/api/interpreter" \
  --data '[out:json][timeout:25];
    area["name"="Bakı"]->.a;
    node["station"="subway"](area.a);
    out body;' \
  > data/stations_raw.json
```

**Note:** OSM metro data for Baku is partially stale (last major edit 2010). Verify against metro.gov.az and cross-reference with Wikipedia before using. The Purple Line is **not reflected in OSM** and must be added manually.

Our compiled `data/stations.json` is the ground truth for the hackathon.

---

## Ridership / Congestion Data

### What we need
Historical passenger counts per station per hour, ideally disaggregated by day of week.

### Status: ❌ Not publicly available

**What exists:**
- **BakıKart tap-in/tap-out data** — held by AYNA (Azerbaijan Land Transport Agency). Not published. Would be the ideal source.
- **Azerbaijan Statistical Committee** (opendata.az) — publishes annual aggregate passenger totals only. Not granular enough.
- **Baku Metro annual reports** — occasional headline figures (e.g. "280,000 daily passengers"). Not time-series.

**Outreach option (post-hackathon):**
Contact AYNA (ayna.gov.az) or Baku Metro directly to request anonymised, aggregated tap data for research purposes. This has worked in comparable cities (Almaty, Tbilisi).

### Our approach: Synthetic data modelled on real patterns

We generate synthetic ridership data using a parametric model based on:

1. **Twin-peak pattern** — standard for post-Soviet urban metros. Morning peak 07:00–09:00, evening peak 17:00–19:00. Validated against Almaty, Tbilisi, and Minsk metro literature.
2. **Day-of-week multipliers** — weekends carry ~65–70% of weekday volume. Derived from aggregate Baku Metro statistics and comparable cities.
3. **Station importance weights** — 28 May (main interchange, all 3 lines) gets weight 1.0. Terminus stations get ~0.40–0.45. Based on network centrality and known catchment areas.
4. **Noise** — Gaussian noise added to simulate real-world variation.

The model is in `ml/data/generate.py`. It produces a CSV with columns:
```
station_id, hour, day_of_week, congestion_score, passenger_count_est
```

**Why this is acceptable for a hackathon:**
The shape of the synthetic data matches documented patterns in analogous metro systems. We are transparent about this — the pitch is the architecture and approach, not the data itself. A production system would replace synthetic data with BakıKart data.

---

## Real-Time Station Feed (CV)

### What we need
Live passenger counts from platform cameras.

### Status: 🟡 Simulated — real cameras exist but are not accessible

Baku Metro stations have CCTV infrastructure. This is not publicly accessible. We simulate it with:
- `cv/stream.py --mock` — generates synthetic detection events following the congestion model
- The CV module is fully functional; only the input (camera feed) is simulated

In a real deployment, the CV module would connect to an RTSP stream from the station camera system.

---

## Bus Network

### Status: ❌ Not used in current scope

BakuBus (bakubus.az) operates 150+ routes. No open API or GTFS feed exists. The BakıKart app has real-time bus tracking but its API is private. Bus integration is explicitly out of scope for this hackathon iteration.

---

## Weather Data (Scraper)

### What we need
Current conditions and short-term forecast (temperature, precipitation, wind) for Baku.

### Status: ✅ Available via API

**Source:** OpenWeatherMap free tier (60 calls/min) or similar weather API.

Scraped every 15 minutes by the scraper module. Used as ML input features — rain and extreme temperatures significantly affect metro/bus ridership patterns.

**Fallback:** If the weather API is unavailable, ML features default to neutral values (20°C, no precipitation). The model degrades gracefully.

---

## Events Data (Scraper)

### What we need
Upcoming events near metro stations — concerts, football matches, large gatherings, public celebrations.

### Status: 🟡 Scraped from public sources

**Sources:**
- Local event listing sites (scraped with BeautifulSoup)
- Tofiq Bahramov Stadium schedule (major football events)
- Public holiday calendar

The scraper extracts event name, location (geocoded), date/time, and estimated attendance. Events within 1km of a metro station are flagged as impactful.

---

## Calendar Metadata (Scraper)

### What we need
Contextual calendar data that affects travel patterns.

### Status: ✅ Computed locally

Generated by the scraper module without external calls:
- National holidays (hardcoded list for Azerbaijan)
- Ramadan dates (affects evening travel patterns — iftar rush)
- School term dates (affects morning peak intensity)
- Day type classification (workday, weekend, holiday, bridge day)

---

## External APIs (Available but Not Used)

| API | Coverage | Status | Why not used |
|-----|----------|--------|--------------|
| Yandex Maps Routing API | Baku metro + bus (real-time) | ✅ Available, requires key | Adds external dependency; our ML model is the differentiator |
| Google Maps Directions API | Metro only (limited) | 🟡 Partial coverage | Same reason |
| 2GIS API | Transit routing | ✅ Available, commercial | Same reason |
| OpenStreetMap Overpass | Station geometry | ✅ Free | Used for station coordinates |

**Decision:** For the hackathon, we own our data pipeline end-to-end rather than wrapping a third-party routing API. This makes our solution more defensible and original.

---

## Data Files in This Repository

```
data/
├── stations.json        # 25 stations: id, name_az, name_en, lat, lng, lines[]
├── network.json         # Line topology: lines[], interchanges[], travel_times{}
├── bus_routes.json      # Bus network: routes, stops, estimated travel times
└── synthetic/
    ├── ridership.csv    # Generated ridership data (8760 rows: 25 stations × 365 days)
    └── generate.py      # Script to regenerate ridership.csv

scraper/
└── data/                # Cached scraped data (not committed, regenerated at runtime)
    ├── weather.json     # Latest weather snapshot
    ├── events.json      # Upcoming events list
    └── calendar.json    # Calendar metadata for current period
```

### stations.json schema
```json
{
  "stations": [
    {
      "id": "28-may",
      "name_az": "28 May",
      "name_en": "28 May",
      "lat": 40.3794,
      "lng": 49.8522,
      "lines": ["red", "green", "purple"],
      "is_interchange": true,
      "weight": 1.0
    }
  ]
}
```

### network.json schema
```json
{
  "lines": [
    {
      "id": "red",
      "name_az": "Qırmızı Xətt",
      "name_en": "Red Line",
      "color": "#E84040",
      "stations": ["icharishahar", "samed-vurgun", "...", "hovsan"]
    }
  ],
  "travel_times": {
    "icharishahar→samed-vurgun": 2,
    "samed-vurgun→nizami": 2
  }
}
```

---

## Regenerating Synthetic Data

```bash
cd data/synthetic
python generate.py --stations ../stations.json --output ridership.csv --seed 42
```

Options:
```
--seed INT       Random seed for reproducibility (default: 42)
--noise FLOAT    Noise amplitude 0–1 (default: 0.05)
--year INT       Year to generate for (affects day-of-week distribution)
```
