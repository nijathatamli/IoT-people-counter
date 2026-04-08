/**
 * Mock data layer — provides realistic Baku metro data when the API is unavailable.
 * Uses the twin-peak Gaussian congestion model from ML_MODEL.md.
 * Accurate station data from OpenStreetMap + Wikipedia, verified against official metro map.
 *
 * Network topology:
 *   Red Line (M1):  Icherisheher → Sahil → 28 May → Ganjlik → Nariman Narimanov →
 *                   Bakmil → Ulduz → Koroglu → Qara Qarayev → Neftchilar →
 *                   Khalglar Dostlugu → Ahmadli → Hazi Aslanov
 *   Green Line (M2): Darnagul → Azadliq Prospekti → Nasimi → Memar Ajami →
 *                    20 Yanvar → Inshaatchilar → Elmlar Akademiyasi → Nizami →
 *                    28 May → Jafar Jabbarly → Khatai
 *   Purple Line (M3): Khojasan → Avtovagzal → Memar Ajami → 8 Noyabr
 *
 * Interchanges: 28 May (Red ↔ Green), Memar Ajami (Green ↔ Purple)
 */

// ── Station Data (3 lines, 26 unique stations) ─────────────────────────────

const STATIONS = [
  // Red Line (13 stations): Icherisheher → Hazi Aslanov
  { id: "icherisheher", name: "Icherisheher", name_az: "\u0130\u00e7\u0259ri\u015f\u0259h\u0259r", lat: 40.3660, lng: 49.8316, lines: ["red"], is_interchange: false, weight: 0.60 },
  { id: "sahil", name: "Sahil", name_az: "Sahil", lat: 40.3717, lng: 49.8446, lines: ["red"], is_interchange: false, weight: 0.65 },
  { id: "28-may", name: "28 May", name_az: "28 May", lat: 40.3799, lng: 49.8486, lines: ["red", "green"], is_interchange: true, weight: 1.00 },
  { id: "ganjlik", name: "Ganjlik", name_az: "G\u0259nclik", lat: 40.3999, lng: 49.8506, lines: ["red"], is_interchange: false, weight: 0.72 },
  { id: "nariman-narimanov", name: "Nariman Narimanov", name_az: "N\u0259riman N\u0259rimanov", lat: 40.4028, lng: 49.8706, lines: ["red"], is_interchange: false, weight: 0.70 },
  { id: "bakmil", name: "Bakmil", name_az: "Bakmil", lat: 40.4141, lng: 49.8788, lines: ["red"], is_interchange: false, weight: 0.48 },
  { id: "ulduz", name: "Ulduz", name_az: "Ulduz", lat: 40.4150, lng: 49.8914, lines: ["red"], is_interchange: false, weight: 0.50 },
  { id: "koroglu", name: "Koroglu", name_az: "Koro\u011flu", lat: 40.4208, lng: 49.9180, lines: ["red"], is_interchange: false, weight: 0.68 },
  { id: "qara-qarayev", name: "Qara Qarayev", name_az: "Qara Qarayev", lat: 40.4176, lng: 49.9340, lines: ["red"], is_interchange: false, weight: 0.55 },
  { id: "neftchilar", name: "Neftchilar", name_az: "Neft\u00e7il\u0259r", lat: 40.4112, lng: 49.9426, lines: ["red"], is_interchange: false, weight: 0.52 },
  { id: "khalglar-dostlugu", name: "Khalglar Dostlugu", name_az: "Xalqlar Dostlu\u011fu", lat: 40.3969, lng: 49.9530, lines: ["red"], is_interchange: false, weight: 0.48 },
  { id: "ahmadli", name: "Ahmadli", name_az: "\u018fhm\u0259dli", lat: 40.3856, lng: 49.9539, lines: ["red"], is_interchange: false, weight: 0.45 },
  { id: "hazi-aslanov", name: "Hazi Aslanov", name_az: "H\u0259zi Aslanov", lat: 40.3730, lng: 49.9536, lines: ["red"], is_interchange: false, weight: 0.42 },

  // Green Line (10 unique stations, shares 28 May with Red): Darnagul → Khatai
  { id: "darnagul", name: "Darnagul", name_az: "D\u0259rn\u0259g\u00fcl", lat: 40.4257, lng: 49.8617, lines: ["green"], is_interchange: false, weight: 0.50 },
  { id: "azadliq", name: "Azadliq Prospekti", name_az: "Azadl\u0131q Prospekti", lat: 40.4260, lng: 49.8429, lines: ["green"], is_interchange: false, weight: 0.55 },
  { id: "nasimi", name: "Nasimi", name_az: "N\u0259simi", lat: 40.4246, lng: 49.8263, lines: ["green"], is_interchange: false, weight: 0.58 },
  { id: "memar-ajami", name: "Memar Ajami", name_az: "Memar \u018fc\u0259mi", lat: 40.4107, lng: 49.8139, lines: ["green", "purple"], is_interchange: true, weight: 0.72 },
  { id: "20-yanvar", name: "20 Yanvar", name_az: "20 Yanvar", lat: 40.4041, lng: 49.8077, lines: ["green"], is_interchange: false, weight: 0.50 },
  { id: "inshaatchilar", name: "Inshaatchilar", name_az: "\u0130n\u015faat\u00e7\u0131lar", lat: 40.3891, lng: 49.8024, lines: ["green"], is_interchange: false, weight: 0.45 },
  { id: "elmlar-akademiyasi", name: "Elmlar Akademiyasi", name_az: "Elml\u0259r Akademiyas\u0131", lat: 40.3752, lng: 49.8155, lines: ["green"], is_interchange: false, weight: 0.55 },
  { id: "nizami", name: "Nizami", name_az: "Nizami", lat: 40.3793, lng: 49.8300, lines: ["green"], is_interchange: false, weight: 0.65 },
  // 28-may shared — defined in Red Line above
  { id: "jafar-jabbarly", name: "Jafar Jabbarly", name_az: "C\u0259f\u0259r Cabbarl\u0131", lat: 40.3797, lng: 49.8489, lines: ["green"], is_interchange: false, weight: 0.60 },
  { id: "khatai", name: "Khatai", name_az: "X\u0259tai", lat: 40.3833, lng: 49.8721, lines: ["green"], is_interchange: false, weight: 0.52 },

  // Purple Line (3 unique stations, shares Memar Ajami with Green): Khojasan → 8 Noyabr
  { id: "khojasan", name: "Khojasan", name_az: "Xocos\u0259n", lat: 40.4212, lng: 49.7791, lines: ["purple"], is_interchange: false, weight: 0.40 },
  { id: "avtovagzal", name: "Avtovagzal", name_az: "Avtova\u011fzal", lat: 40.4215, lng: 49.7952, lines: ["purple"], is_interchange: false, weight: 0.55 },
  // memar-ajami shared — defined in Green Line above
  { id: "8-noyabr", name: "8 Noyabr", name_az: "8 Noyabr", lat: 40.4019, lng: 49.8205, lines: ["purple"], is_interchange: false, weight: 0.48 },
];

// ── Network Topology ────────────────────────────────────────────────────────

const LINES = [
  {
    id: "red",
    name: "Red Line",
    name_az: "Q\u0131rm\u0131z\u0131 X\u0259tt",
    color: "#dc2626",
    stations: [
      "icherisheher", "sahil", "28-may", "ganjlik", "nariman-narimanov",
      "bakmil", "ulduz", "koroglu", "qara-qarayev", "neftchilar",
      "khalglar-dostlugu", "ahmadli", "hazi-aslanov",
    ],
  },
  {
    id: "green",
    name: "Green Line",
    name_az: "Ya\u015f\u0131l X\u0259tt",
    color: "#16a34a",
    stations: [
      "darnagul", "azadliq", "nasimi", "memar-ajami", "20-yanvar",
      "inshaatchilar", "elmlar-akademiyasi", "nizami", "28-may",
      "jafar-jabbarly", "khatai",
    ],
  },
  {
    id: "purple",
    name: "Purple Line",
    name_az: "B\u0259n\u00f6v\u015f\u0259yi X\u0259tt",
    color: "#7c3aed",
    stations: ["khojasan", "avtovagzal", "memar-ajami", "8-noyabr"],
  },
];

// ── Build adjacency graph ───────────────────────────────────────────────────

// Deterministic travel times (minutes) between adjacent stations
const TRAVEL_TIMES = {
  // Red
  "icherisheher-sahil": 2, "sahil-28-may": 2, "28-may-ganjlik": 3,
  "ganjlik-nariman-narimanov": 2, "nariman-narimanov-bakmil": 2,
  "bakmil-ulduz": 2, "ulduz-koroglu": 3, "koroglu-qara-qarayev": 2,
  "qara-qarayev-neftchilar": 2, "neftchilar-khalglar-dostlugu": 2,
  "khalglar-dostlugu-ahmadli": 2, "ahmadli-hazi-aslanov": 2,
  // Green
  "darnagul-azadliq": 2, "azadliq-nasimi": 2, "nasimi-memar-ajami": 3,
  "memar-ajami-20-yanvar": 2, "20-yanvar-inshaatchilar": 2,
  "inshaatchilar-elmlar-akademiyasi": 3, "elmlar-akademiyasi-nizami": 2,
  "nizami-28-may": 2, "28-may-jafar-jabbarly": 1, "jafar-jabbarly-khatai": 3,
  // Purple
  "khojasan-avtovagzal": 3, "avtovagzal-memar-ajami": 3, "memar-ajami-8-noyabr": 2,
};

function travelTime(a, b) {
  return TRAVEL_TIMES[`${a}-${b}`] || TRAVEL_TIMES[`${b}-${a}`] || 2;
}

function buildGraph() {
  const graph = {};
  for (const line of LINES) {
    for (let i = 0; i < line.stations.length - 1; i++) {
      const a = line.stations[i];
      const b = line.stations[i + 1];
      if (!graph[a]) graph[a] = [];
      if (!graph[b]) graph[b] = [];
      const time = travelTime(a, b);
      // Avoid duplicate edges
      if (!graph[a].some((e) => e.to === b && e.line === line.id)) {
        graph[a].push({ to: b, time, line: line.id });
      }
      if (!graph[b].some((e) => e.to === a && e.line === line.id)) {
        graph[b].push({ to: a, time, line: line.id });
      }
    }
  }
  return graph;
}

const GRAPH = buildGraph();

// ── Congestion Model (twin-peak Gaussian from ML_MODEL.md) ──────────────────

function fallbackLoad(hour, stationWeight = 0.7, dayFactor = 1.0) {
  const morning = 0.9 * Math.exp(-((hour - 8.0) ** 2) / (2 * 1.2 ** 2));
  const evening = 0.93 * Math.exp(-((hour - 18.0) ** 2) / (2 * 1.0 ** 2));
  const base = 0.12;
  return Math.min(1.0, (Math.max(morning, evening) + base) * stationWeight * dayFactor);
}

function getDayFactor(day) {
  if (day === 0 || day === 6) return 0.65;
  if (day === 5) return 0.85;
  return 1.0;
}

function congestionLabel(score) {
  if (score < 0.35) return "Low";
  if (score < 0.6) return "Moderate";
  if (score < 0.8) return "High";
  return "Peak";
}

function addNoise(val, amplitude = 0.04) {
  return Math.max(0, Math.min(1.0, val + (Math.random() - 0.5) * 2 * amplitude));
}

// ── Route Computation (BFS with mode-based scoring) ─────────────────────────

function findAllRoutes(originId, destId, maxRoutes = 5) {
  const routes = [];
  const queue = [[originId, [{ station: originId, line: null }], new Set([originId])]];

  while (queue.length > 0 && routes.length < maxRoutes * 3) {
    const [current, path, visited] = queue.shift();
    if (current === destId) {
      routes.push(path);
      continue;
    }
    if (path.length > 20) continue;
    const neighbors = GRAPH[current] || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.to)) {
        const newVisited = new Set(visited);
        newVisited.add(edge.to);
        queue.push([
          edge.to,
          [...path, { station: edge.to, line: edge.line, time: edge.time }],
          newVisited,
        ]);
      }
    }
  }

  return routes.slice(0, maxRoutes);
}

function buildRouteResponse(path, hour, day) {
  const steps = [];
  let totalTime = 0;
  let totalTransfers = 0;
  let totalWalking = 0;
  let congestionSum = 0;
  let segmentCount = 0;
  const dayFactor = getDayFactor(day);
  let currentLine = null;

  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const station = STATIONS.find((s) => s.id === curr.station);
    const weight = station?.weight || 0.5;

    if (curr.line !== currentLine && currentLine !== null) {
      totalTransfers++;
      const walkTime = 3;
      totalWalking += walkTime;
      totalTime += walkTime;
      steps.push({
        type: "walk",
        from: prev.station,
        to: curr.station,
        duration_min: walkTime,
        description: "Transfer via underground passage",
      });
    }

    currentLine = curr.line;

    const score = addNoise(fallbackLoad(hour, weight, dayFactor));
    congestionSum += score;
    segmentCount++;
    totalTime += curr.time || 2;

    steps.push({
      type: "metro",
      from: prev.station,
      to: curr.station,
      line: curr.line,
      duration_min: curr.time || 2,
      congestion_score: Math.round(score * 100) / 100,
    });
  }

  const avgCongestion = segmentCount > 0 ? congestionSum / segmentCount : 0;

  return {
    total_time_min: Math.round(totalTime),
    total_transfers: totalTransfers,
    total_walking_min: totalWalking,
    avg_congestion: Math.round(avgCongestion * 100) / 100,
    congestion_label: congestionLabel(avgCongestion),
    transport_modes: totalWalking > 0 ? ["metro", "walk"] : ["metro"],
    steps,
  };
}

function scoreRoute(route, mode) {
  switch (mode) {
    case "fastest":
      return route.total_time_min;
    case "ease":
      return route.avg_congestion;
    case "least_transfers":
      return route.total_transfers * 100 + route.total_time_min;
    case "most_walking":
      return -route.total_walking_min;
    default:
      return route.total_time_min;
  }
}

// ── Mock API Response Generators ────────────────────────────────────────────

export function mockGetStations() {
  return {
    stations: STATIONS.map(({ weight, ...s }) => s),
    count: STATIONS.length,
  };
}

export function mockGetNetwork() {
  const travelTimesMap = {};
  for (const line of LINES) {
    for (let i = 0; i < line.stations.length - 1; i++) {
      const a = line.stations[i];
      const b = line.stations[i + 1];
      travelTimesMap[`${a}\u2192${b}`] = travelTime(a, b);
    }
  }
  return {
    lines: LINES,
    travel_times: travelTimesMap,
    interchanges: ["28-may", "memar-ajami"],
  };
}

export function mockGetLive(stationId, zone) {
  const station = STATIONS.find((s) => s.id === stationId);
  if (!station) return null;

  const hour = new Date().getHours();
  const day = new Date().getDay();
  const dayFactor = getDayFactor(day);
  const baseScore = fallbackLoad(hour, station.weight, dayFactor);

  const makeZone = (type, multiplier = 1.0) => {
    const score = addNoise(baseScore * multiplier);
    const count = Math.round(score * (type === "wagon" ? 60 : type === "bus" ? 40 : 25));
    return {
      person_count: count,
      density_score: Math.round(score * 100) / 100,
      label: congestionLabel(score),
    };
  };

  const zones = {
    platform: makeZone("platform", 1.0),
    wagon: makeZone("wagon", 1.1),
    waiting: makeZone("waiting", 0.6),
  };

  const primary = zone && zone !== "all" ? zones[zone] || zones.platform : zones.platform;

  return {
    station_id: stationId,
    timestamp: new Date().toISOString(),
    person_count: primary.person_count,
    density_score: primary.density_score,
    congestion_label: primary.label,
    source: "mock",
    zone: zone || "platform",
    zones,
    ml_prediction: {
      score: Math.round(addNoise(baseScore, 0.03) * 100) / 100,
      label: congestionLabel(baseScore),
      confidence: 0.85 + Math.random() * 0.1,
    },
    stale: false,
  };
}

export function mockGetPredictDay(stationId, day) {
  const station = STATIONS.find((s) => s.id === stationId);
  const weight = station?.weight || 0.5;
  const d = day !== undefined ? day : new Date().getDay();
  const dayFactor = getDayFactor(d);

  const hourly = [];
  for (let h = 0; h < 24; h++) {
    const score = addNoise(fallbackLoad(h, weight, dayFactor), 0.02);
    hourly.push({
      hour: h,
      score: Math.round(score * 100) / 100,
      label: congestionLabel(score),
    });
  }

  return { station_id: stationId, day: d, hourly };
}

export function mockGetPredict(stationId, hour, day) {
  const station = STATIONS.find((s) => s.id === stationId);
  const weight = station?.weight || 0.5;
  const d = day !== undefined ? day : new Date().getDay();
  const score = addNoise(fallbackLoad(hour, weight, getDayFactor(d)));

  return {
    station_id: stationId,
    hour,
    day: d,
    congestion_score: Math.round(score * 100) / 100,
    congestion_label: congestionLabel(score),
    model_version: "1.0.0-mock",
  };
}

export function mockGetDirections(origin, dest, mode = "fastest", hour, day) {
  const h = hour !== undefined ? hour : new Date().getHours();
  const d = day !== undefined ? day : new Date().getDay();

  const rawPaths = findAllRoutes(origin, dest);
  if (rawPaths.length === 0) {
    return { origin, dest, mode, routes: [], context: { weather: "clear", events_nearby: [] } };
  }

  const routes = rawPaths
    .map((path) => buildRouteResponse(path, h, d))
    .sort((a, b) => scoreRoute(a, mode) - scoreRoute(b, mode))
    .slice(0, 3)
    .map((r, i) => ({ rank: i + 1, ...r }));

  const weatherOptions = ["clear", "partly cloudy", "rain", "overcast"];
  const weather = weatherOptions[Math.floor(Math.random() * 2)];

  return {
    origin,
    dest,
    mode,
    routes,
    context: {
      weather,
      events_nearby: h >= 17 && h <= 21
        ? ["Football match at Tofiq Bahramov Stadium, 19:00"]
        : [],
    },
  };
}

export function mockGetRecommend(origin, dest, day) {
  const d = day !== undefined ? day : new Date().getDay();
  const dayFactor = getDayFactor(d);
  const originSt = STATIONS.find((s) => s.id === origin);
  const destSt = STATIONS.find((s) => s.id === dest);
  const oWeight = originSt?.weight || 0.5;
  const dWeight = destSt?.weight || 0.5;

  const allHours = [];
  let bestHour = 10;
  let bestScore = 1;

  for (let h = 5; h < 23; h++) {
    const oScore = fallbackLoad(h, oWeight, dayFactor);
    const dScore = fallbackLoad(h, dWeight, dayFactor);
    const avg = (oScore + dScore) / 2;
    allHours.push({ hour: h, score: Math.round(avg * 100) / 100 });
    if (avg < bestScore) {
      bestScore = avg;
      bestHour = h;
    }
  }

  const currentHour = new Date().getHours();
  const currentLoad = (fallbackLoad(currentHour, oWeight, dayFactor) + fallbackLoad(currentHour, dWeight, dayFactor)) / 2;

  return {
    origin,
    dest,
    day: d,
    optimal_hour: bestHour,
    predicted_load: Math.round(bestScore * 100) / 100,
    congestion_label: congestionLabel(bestScore),
    recommended_mode: "metro",
    reasoning: `Lowest average congestion across ${originSt?.name || origin} and ${destSt?.name || dest} between 05:00 and 23:00. Metro recommended due to lower predicted congestion.`,
    current_load: Math.round(currentLoad * 100) / 100,
    current_hour: currentHour,
    hours_until_optimal: bestHour > currentHour ? bestHour - currentHour : bestHour + 24 - currentHour,
    context: {
      weather: "clear",
      events_nearby: [],
      is_holiday: false,
    },
    all_hours: allHours,
  };
}

export function mockGetStationsRanked(hour, day) {
  const h = hour !== undefined ? hour : new Date().getHours();
  const d = day !== undefined ? day : new Date().getDay();
  const dayFactor = getDayFactor(d);

  const ranked = STATIONS
    .map((s) => {
      const score = addNoise(fallbackLoad(h, s.weight, dayFactor), 0.02);
      return {
        station_id: s.id,
        name: s.name,
        lines: s.lines,
        congestion_score: Math.round(score * 100) / 100,
        congestion_label: congestionLabel(score),
      };
    })
    .sort((a, b) => b.congestion_score - a.congestion_score)
    .map((s, i) => ({ rank: i + 1, ...s }));

  return {
    timestamp: new Date().toISOString(),
    hour: h,
    ranked,
  };
}

export function mockGetScraperStatus() {
  const now = new Date().toISOString();
  return {
    sources: {
      weather: { last_updated: now, status: "ok", stale: false },
      events: { last_updated: now, status: "ok", stale: false },
      calendar: { last_updated: now, status: "ok", stale: false },
    },
    scrape_interval_minutes: 15,
  };
}

export function mockGetPredictTravel(origin, dest, hour, day) {
  const paths = findAllRoutes(origin, dest, 1);
  const h = hour !== undefined ? hour : new Date().getHours();
  let baseTime = 10;

  if (paths.length > 0) {
    baseTime = paths[0].reduce((sum, node, i) => (i === 0 ? 0 : sum + (node.time || 2)), 0);
  }

  const isPeak = (h >= 7 && h <= 9) || (h >= 17 && h <= 19);
  const predictedTime = Math.round(baseTime * (isPeak ? 1.2 : 1.0));

  return {
    origin,
    dest,
    hour: h,
    day: day !== undefined ? day : new Date().getDay(),
    predicted_travel_time_min: predictedTime,
    confidence: 0.85,
    factors: {
      weather_impact: "none",
      event_impact: "none",
      peak_hour_delay: isPeak,
    },
  };
}
