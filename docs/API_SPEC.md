# API Specification

Base URL (local): `http://localhost:8000`  
Auto-generated docs: `http://localhost:8000/docs` (Swagger UI)

All responses are JSON. All timestamps are ISO 8601 UTC.

---

## Public Endpoints (Frontend → API)

### GET `/stations`

Returns all metro stations with metadata.

**Response:**
```json
{
  "stations": [
    {
      "id": "28-may",
      "name": "28 May",
      "name_az": "28 May",
      "lat": 40.3794,
      "lng": 49.8522,
      "lines": ["red", "green", "purple"],
      "is_interchange": true
    }
  ],
  "count": 25
}
```

---

### GET `/network`

Returns full metro network topology (lines, stations in order, travel times).

**Response:**
```json
{
  "lines": [
    {
      "id": "red",
      "name": "Red Line",
      "color": "#E84040",
      "stations": ["icharishahar", "samed-vurgun", "nizami", "28-may", "..."]
    }
  ],
  "travel_times": {
    "icharishahar→samed-vurgun": 2,
    "samed-vurgun→nizami": 2,
    "nizami→28-may": 2
  },
  "interchanges": ["28-may"]
}
```

---

### GET `/live/{station_id}`

Returns the latest real-time data for a station (CV count + ML prediction).

**Path parameters:**
- `station_id` — station identifier (e.g. `28-may`)

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `zone` | string | ❌ | Zone type: `platform`, `wagon`, `bus`, `waiting` (default: all zones) |

**Response:**
```json
{
  "station_id": "28-may",
  "timestamp": "2026-05-01T09:14:22Z",
  "person_count": 12,
  "density_score": 0.74,
  "congestion_label": "High",
  "source": "cv",
  "zone": "platform",
  "zones": {
    "platform": { "person_count": 12, "density_score": 0.74, "label": "High" },
    "wagon": { "person_count": 45, "density_score": 0.62, "label": "High" },
    "waiting": { "person_count": 8, "density_score": 0.31, "label": "Low" }
  },
  "ml_prediction": {
    "score": 0.71,
    "label": "High",
    "confidence": 0.88
  },
  "stale": false
}
```

**`source` field:**
- `"cv"` — data from CV module (last update <30s ago)
- `"ml"` — CV data unavailable, using ML prediction only
- `"mock"` — running in mock mode

**`stale` field:** `true` if last CV update was >60 seconds ago.

**Error (station not found):**
```json
{
  "error": "station_not_found",
  "station_id": "invalid-id",
  "status": 404
}
```

---

### GET `/predict`

Returns ML-predicted congestion for a station at a specific time.

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `station_id` | string | ✅ | Station identifier |
| `hour` | integer | ✅ | Hour of day 0–23 |
| `day` | integer | ❌ | Day of week 0–6 (default: today) |

**Example:** `GET /predict?station_id=28-may&hour=8&day=1`

**Response:**
```json
{
  "station_id": "28-may",
  "hour": 8,
  "day": 1,
  "congestion_score": 0.88,
  "congestion_label": "Peak",
  "model_version": "1.0.0"
}
```

---

### GET `/predict/day`

Returns predicted congestion for all 24 hours for a station (used for the hourly chart).

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `station_id` | string | ✅ | Station identifier |
| `day` | integer | ❌ | Day of week 0–6 (default: today) |

**Response:**
```json
{
  "station_id": "28-may",
  "day": 1,
  "hourly": [
    { "hour": 0, "score": 0.05, "label": "Low" },
    { "hour": 1, "score": 0.04, "label": "Low" },
    "...",
    { "hour": 8, "score": 0.88, "label": "Peak" },
    "..."
  ]
}
```

---

### GET `/recommend`

Returns the optimal departure window and recommended transport mode for a route, minimising congestion.

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `origin` | string | ✅ | Origin station ID |
| `dest` | string | ✅ | Destination station ID |
| `day` | integer | ❌ | Day of week 0–6 (default: today) |

**Example:** `GET /recommend?origin=icharishahar&dest=koroglu&day=1`

**Response:**
```json
{
  "origin": "icharishahar",
  "dest": "koroglu",
  "day": 1,
  "optimal_hour": 10,
  "predicted_load": 0.31,
  "congestion_label": "Low",
  "recommended_mode": "metro",
  "reasoning": "Lowest average congestion across origin and destination stations between 05:00 and 23:00. Metro recommended over bus due to lower predicted congestion.",
  "current_load": 0.88,
  "current_hour": 8,
  "hours_until_optimal": 2,
  "context": {
    "weather": "rain",
    "events_nearby": [],
    "is_holiday": false
  },
  "all_hours": [
    { "hour": 5, "score": 0.12 },
    { "hour": 6, "score": 0.21 },
    "..."
  ]
}
```

---

### GET `/stations/ranked`

Returns all stations ranked by current congestion (used for Station Intel tab).

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `hour` | integer | ❌ | Hour to rank by (default: current) |
| `day` | integer | ❌ | Day of week (default: today) |

**Response:**
```json
{
  "timestamp": "2026-05-01T09:14:22Z",
  "hour": 9,
  "ranked": [
    {
      "rank": 1,
      "station_id": "28-may",
      "name": "28 May",
      "lines": ["red", "green", "purple"],
      "congestion_score": 0.91,
      "congestion_label": "Peak"
    },
    "..."
  ]
}
```

---

### GET `/directions`

Returns multi-criteria route options between two stations. This is the primary routing endpoint.

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `origin` | string | ✅ | Origin station/stop ID |
| `dest` | string | ✅ | Destination station/stop ID |
| `mode` | string | ❌ | Routing mode: `fastest`, `ease`, `least_transfers`, `most_walking` (default: `fastest`) |
| `day` | integer | ❌ | Day of week 0–6 (default: today) |
| `hour` | integer | ❌ | Departure hour 0–23 (default: now) |

**Example:** `GET /directions?origin=icharishahar&dest=koroglu&mode=ease&hour=8`

**Response:**
```json
{
  "origin": "icharishahar",
  "dest": "koroglu",
  "mode": "ease",
  "routes": [
    {
      "rank": 1,
      "total_time_min": 22,
      "total_transfers": 1,
      "total_walking_min": 5,
      "avg_congestion": 0.31,
      "congestion_label": "Low",
      "transport_modes": ["metro", "walk"],
      "steps": [
        {
          "type": "metro",
          "from": "icharishahar",
          "to": "28-may",
          "line": "red",
          "duration_min": 12,
          "congestion_score": 0.28
        },
        {
          "type": "walk",
          "from": "28-may",
          "to": "28-may-green",
          "duration_min": 3,
          "description": "Transfer via underground passage"
        },
        {
          "type": "metro",
          "from": "28-may",
          "to": "koroglu",
          "line": "green",
          "duration_min": 7,
          "congestion_score": 0.34
        }
      ]
    }
  ],
  "context": {
    "weather": "clear",
    "events_nearby": ["football match at Tofiq Bahramov Stadium, 19:00"]
  }
}
```

**Routing modes explained:**
- `fastest` — minimises `total_time_min`
- `ease` — minimises `avg_congestion` across all segments
- `least_transfers` — minimises `total_transfers`
- `most_walking` — maximises `total_walking_min` (walking segments replace short transit hops)

---

### GET `/predict/travel`

Returns predicted travel time between two nodes.

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `origin` | string | ✅ | Origin station/stop ID |
| `dest` | string | ✅ | Destination station/stop ID |
| `hour` | integer | ❌ | Hour of day 0–23 (default: now) |
| `day` | integer | ❌ | Day of week 0–6 (default: today) |

**Response:**
```json
{
  "origin": "icharishahar",
  "dest": "koroglu",
  "hour": 8,
  "day": 1,
  "predicted_travel_time_min": 19,
  "confidence": 0.85,
  "factors": {
    "weather_impact": "none",
    "event_impact": "minor",
    "peak_hour_delay": true
  }
}
```

---

### GET `/scraper/status`

Returns the freshness and health of scraped data sources.

**Response:**
```json
{
  "sources": {
    "weather": {
      "last_updated": "2026-05-01T09:00:00Z",
      "status": "ok",
      "stale": false
    },
    "events": {
      "last_updated": "2026-05-01T08:45:00Z",
      "status": "ok",
      "stale": false
    },
    "calendar": {
      "last_updated": "2026-05-01T00:00:00Z",
      "status": "ok",
      "stale": false
    }
  },
  "scrape_interval_minutes": 15
}
```

---

## Internal Endpoints (CV Module → API)

These endpoints are not exposed to the frontend. They are used by the CV module to push detection results.

### POST `/internal/cv/{station_id}`

Receives detection results from the CV module.

**Authentication:** Internal only — bind to localhost, not exposed in docker-compose

**Request body:**
```json
{
  "station_id": "28-may",
  "timestamp": "2026-05-01T09:14:22Z",
  "person_count": 12,
  "density_score": 0.74,
  "detections": [
    {
      "bbox": [120.5, 80.2, 145.3, 160.8],
      "confidence": 0.87
    }
  ],
  "source": "cv",
  "camera_id": "cam-01"
}
```

**Response:**
```json
{ "status": "accepted" }
```

---

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | `invalid_parameters` | Missing or invalid query parameters |
| 404 | `station_not_found` | Station ID does not exist |
| 422 | `validation_error` | Request body schema violation |
| 503 | `model_unavailable` | ML model failed to load |

---

## Rate Limits (Production)

Not enforced in hackathon demo. Production values:

| Endpoint | Limit |
|----------|-------|
| `/live/{id}` | 60 req/min per IP |
| `/recommend` | 30 req/min per IP |
| `/internal/cv/*` | 10 req/sec per station |

---

## Versioning

Current version: `v1` (implicit, no prefix in hackathon build).

Future: all endpoints prefixed with `/v1/` for backwards compatibility.
