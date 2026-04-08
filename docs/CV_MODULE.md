# CV Module — Passenger Detection Pipeline

## Overview

The CV module processes camera feeds from metro station platforms, metro wagons, buses, and station waiting areas, and outputs real-time passenger counts and density estimates per zone. It runs as an independent service that pushes results to the API.

**Detection zones:**
| Zone | Camera location | Use case |
|------|----------------|----------|
| `platform` | Overhead cameras on station platforms | Platform crowding before boarding |
| `wagon` | In-car cameras inside metro wagons | On-board occupancy |
| `bus` | On-board cameras inside buses | Bus crowding levels |
| `waiting` | Cameras in station concourses/corridors | Waiting area density |

**Key design principles:**
- No raw video leaves the station/vehicle (privacy by design)
- Runs on modest hardware (Raspberry Pi 5 or entry-level GPU)
- Graceful degradation: if a camera feed drops, the API falls back to ML predictions
- Each zone type has independent density calibration (different area, capacity thresholds)
- Mock mode for development without camera hardware

---

## Model

**YOLOv8-nano** (Ultralytics)

| Property | Value |
|----------|-------|
| Model size | 6.3 MB |
| Inference speed (CPU) | ~25ms/frame on Raspberry Pi 5 |
| Inference speed (GPU) | ~4ms/frame on Jetson Nano |
| mAP@50 (COCO) | 37.3 |
| Classes used | `person` only (class 0) |

We use only the `person` class. All other detections are discarded.

**Why YOLOv8-nano over larger variants:**
- Edge hardware constraint — stations have no GPU server
- 25ms latency is sufficient for 3-second polling intervals
- Counting accuracy is more important than bounding box precision

**Weights:**
- Base weights: `yolov8n.pt` (pretrained on COCO, downloaded from Ultralytics)
- Fine-tuned weights (optional): `yolov8n_metro.pt` — if training data from metro platforms becomes available

---

## Pipeline

```
Camera (RTSP) → Frame Buffer → Pre-processor → YOLOv8-nano → Post-processor → Publisher
                    ↓                                               ↓
               Drop frames if                            Filter person class
               buffer full                               NMS, confidence threshold
                                                                    ↓
                                                         Count persons in ROI
                                                                    ↓
                                                         Density estimation
                                                                    ↓
                                                         POST /internal/cv/{station_id}
```

### Step 1: Frame capture

```python
class StreamHandler:
    def __init__(self, rtsp_url, fps_target=2):
        self.cap = cv2.VideoCapture(rtsp_url)
        self.fps_target = fps_target  # 2 FPS is sufficient for counting
    
    def read_frame(self):
        ret, frame = self.cap.read()
        if not ret:
            self._reconnect()
        return frame
```

We process at **2 FPS** — sufficient for crowd counting, reduces compute load by 15x compared to 30 FPS.

### Step 2: Pre-processing

```python
def preprocess(frame):
    # Resize to 640×640 (YOLOv8 input size)
    frame = cv2.resize(frame, (640, 640))
    # Normalise to 0-1
    frame = frame / 255.0
    return frame
```

### Step 3: Inference

```python
class Detector:
    def __init__(self, model_path="yolov8n.pt", confidence=0.45):
        self.model = YOLO(model_path)
        self.confidence = confidence
    
    def detect(self, frame):
        results = self.model(frame, classes=[0], conf=self.confidence, verbose=False)
        detections = []
        for box in results[0].boxes:
            detections.append({
                "bbox": box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
                "confidence": float(box.conf),
                "id": None  # tracking ID, set by tracker if enabled
            })
        return detections
```

**Confidence threshold: 0.45**
Lower than the default 0.5 because platform lighting is variable. Reduces false negatives at the cost of slightly more false positives. Validated on indoor crowd datasets.

**Zone-specific considerations:**
- **Wagon/bus cameras:** Closer proximity to passengers, more occlusion from standing crowds. May benefit from a slightly lower confidence threshold (0.40).
- **Waiting area cameras:** Wider field of view, more open space, fewer occlusion issues.

### Step 4: Region of Interest (ROI) filtering

Not all parts of the frame are the platform. We crop to the ROI defined per camera:

```python
def filter_roi(detections, roi_polygon):
    """Keep only detections whose centre point falls inside the ROI polygon."""
    filtered = []
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        if point_in_polygon(cx, cy, roi_polygon):
            filtered.append(det)
    return filtered
```

ROI polygons are defined in `data/stations.json` under `camera_roi` per station.

### Step 5: Density estimation

Raw person count is converted to a normalised density score. Each zone type has its own area and capacity parameters defined in `cv/zones/`:

```python
def estimate_density(count, area_m2, persons_per_m2_max=2.5):
    """
    Based on Fruin Level of Service methodology:
    - LOS A: < 0.3 p/m² (free flow)
    - LOS C: 0.7–1.1 p/m² (restricted)
    - LOS E: 1.5–2.5 p/m² (near capacity)
    """
    density = count / area_m2
    score = min(1.0, density / persons_per_m2_max)
    return score
```

**Zone calibration defaults:**
| Zone | area_m2 | persons_per_m2_max | Notes |
|------|---------|-------------------|-------|
| `platform` | Per station (from `stations.json`) | 2.5 | Fruin LOS E |
| `wagon` | ~36 m² (standard Baku metro car) | 4.0 | Standing capacity |
| `bus` | ~20 m² (standard city bus interior) | 3.5 | Standing capacity |
| `waiting` | Per station (from `stations.json`) | 2.0 | Concourse/corridor |

Zone configs live in `cv/zones/` as JSON files per zone type.

### Step 6: Publishing

```python
def publish(station_id, zone_type, count, density_score, detections):
    payload = {
        "station_id": station_id,
        "zone": zone_type,  # "platform", "wagon", "bus", "waiting"
        "timestamp": datetime.utcnow().isoformat(),
        "person_count": count,
        "density_score": density_score,
        "detections": detections,  # bounding boxes for debug overlay
        "source": "cv"
    }
    requests.post(f"http://api:8000/internal/cv/{station_id}", json=payload)
```

---

## Mock Mode

For development and the hackathon demo, `stream.py --mock` replaces the camera feed with synthetic detection data:

```bash
python stream.py --mock --station "28-may" --interval 3
python stream.py --mock --station "28-may" --zone wagon --interval 3
python stream.py --mock --all-stations --all-zones --interval 3
```

Mock mode uses the analytical congestion model to generate realistic person counts that match expected patterns for the current time of day across all zone types. The output format is identical to real CV output — the API cannot distinguish between mock and real data.

---

## Privacy Design

| Data | Stored? | Transmitted? |
|------|---------|-------------|
| Raw video frames | Never | Never |
| Bounding box coordinates | No (used only within frame) | Debug mode only |
| Person count (integer) | Yes (5-min aggregates) | Yes |
| Density score | Yes | Yes |
| Biometric data | Never collected | Never |

The CV module is **privacy by design**. It discards frames immediately after inference. No individual can be identified from the data the system stores or transmits.

---

## Running the CV Module

```bash
cd cv

# Install dependencies
pip install -r requirements.txt
# Automatically downloads yolov8n.pt on first run

# Mock mode (for development)
python stream.py --mock --station 28-may

# Real camera feed
python stream.py --rtsp rtsp://camera-ip:554/stream --station 28-may

# All stations in mock mode (for demo)
python stream.py --mock --all-stations
```

**requirements.txt:**
```
ultralytics==8.2.0
opencv-python-headless==4.9.0.80
requests==2.31.0
numpy==1.26.4
```

---

## Testing

```bash
# Unit tests
pytest tests/test_detector.py
pytest tests/test_counter.py

# Integration test with mock stream
python tests/test_integration.py --mock

# Benchmark inference speed
python benchmark.py --model yolov8n.pt --frames 100
```

---

## Known Limitations

- **Occlusion:** Passengers standing behind pillars or crowds are not counted. This causes under-counting at peak times. Mitigated by calibrating the density model against known peak passenger volumes.
- **Camera angle:** YOLOv8 is trained on upright human images. Overhead cameras (common in metro stations) reduce accuracy. Fine-tuning on overhead crowd datasets would improve this.
- **Lighting variation:** Platform lighting changes when trains arrive (lights from the train). Confidence threshold set conservatively to handle this.
- **Single camera per station:** This prototype assumes one camera per platform. In practice, multiple cameras with view aggregation would improve accuracy.
- **Wagon/bus motion:** Camera shake from vehicle movement can reduce detection accuracy. Frame stabilisation may be needed for production deployments.
- **Bus coverage:** Bus interior cameras are a stretch goal — metro zones (platform, wagon, waiting) take priority for the hackathon.
