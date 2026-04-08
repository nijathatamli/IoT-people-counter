import { useState, useEffect, useCallback } from "react";
import useStations from "./hooks/use-stations";
import usePoll from "./hooks/use-poll";
import {
  getNetwork,
  getDirections,
  getRecommend,
  getLive,
  getPredictDay,
  getStationsRanked,
} from "./api";
import RouteMap from "./components/RouteMap.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import StationDetail from "./components/StationDetail.jsx";

export default function App() {
  const { stations } = useStations();
  const [network, setNetwork] = useState(null);

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);

  // Route planning
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [mode, setMode] = useState("fastest");
  const [hour, setHour] = useState(new Date().getHours());
  const [day, setDay] = useState(new Date().getDay());
  const [routes, setRoutes] = useState(null);
  const [context, setContext] = useState(null);
  const [recommend, setRecommend] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Station detail data
  const [liveData, setLiveData] = useState(null);
  const [dayData, setDayData] = useState(null);

  // Congestion for map markers
  const [congestionMap, setCongestionMap] = useState({});

  // Load network once
  useEffect(() => {
    getNetwork().then(setNetwork).catch(() => {});
  }, []);

  // Poll station rankings for map marker coloring
  const fetchRanked = useCallback(
    () => getStationsRanked(new Date().getHours(), new Date().getDay()),
    [],
  );
  const { data: rankedData } = usePoll(fetchRanked, 30000, true);

  useEffect(() => {
    if (rankedData?.ranked) {
      const m = {};
      rankedData.ranked.forEach((s) => {
        m[s.station_id] = s.congestion_score;
      });
      setCongestionMap(m);
    }
  }, [rankedData]);

  // Fetch live data when station selected
  useEffect(() => {
    if (!selectedStation) {
      setLiveData(null);
      setDayData(null);
      return;
    }
    getLive(selectedStation).then(setLiveData).catch(() => setLiveData(null));
    getPredictDay(selectedStation)
      .then(setDayData)
      .catch(() => setDayData(null));
  }, [selectedStation]);

  // Search routes
  const search = useCallback(async () => {
    if (!origin || !dest || origin === dest) return;
    setLoading(true);
    setError(null);
    try {
      const [dirRes, recRes] = await Promise.all([
        getDirections(origin, dest, mode, hour, day),
        getRecommend(origin, dest, day),
      ]);
      setRoutes(dirRes.routes);
      setContext(dirRes.context);
      setRecommend(recRes);
    } catch (err) {
      setError(err.body?.error || "Failed to load routes");
      setRoutes(null);
      setRecommend(null);
    } finally {
      setLoading(false);
    }
  }, [origin, dest, mode, hour, day]);

  const clearRoute = useCallback(() => {
    setOrigin("");
    setDest("");
    setRoutes(null);
    setRecommend(null);
    setContext(null);
    setError(null);
  }, []);

  const swapStations = useCallback(() => {
    const o = origin;
    setOrigin(dest);
    setDest(o);
    setRoutes(null);
    setRecommend(null);
    setContext(null);
  }, [origin, dest]);

  // Station click on map
  const handleStationClick = useCallback(
    (id) => {
      setSelectedStation(id);
    },
    [],
  );

  // "Directions from/to" from station detail panel
  const handleDirectionsFrom = useCallback((id) => {
    setOrigin(id);
    setDest("");
    setRoutes(null);
    setRecommend(null);
    setContext(null);
    setSelectedStation(null);
    setPanelOpen(true);
  }, []);

  const handleDirectionsTo = useCallback(
    (id) => {
      if (!origin) {
        setOrigin(id);
      } else {
        setDest(id);
      }
      setRoutes(null);
      setRecommend(null);
      setContext(null);
      setSelectedStation(null);
      setPanelOpen(true);
    },
    [origin],
  );

  const setOriginClear = useCallback((v) => {
    setOrigin(v);
    setRoutes(null);
    setRecommend(null);
    setContext(null);
  }, []);

  const setDestClear = useCallback((v) => {
    setDest(v);
    setRoutes(null);
    setRecommend(null);
    setContext(null);
  }, []);

  return (
    <>
      {/* Full-screen map */}
      <RouteMap
        stations={stations}
        network={network}
        origin={origin}
        dest={dest}
        routes={routes}
        congestionMap={congestionMap}
        selectedStation={selectedStation}
        onStationClick={handleStationClick}
      />

      {/* Floating search pill (visible when panel is closed) */}
      {!panelOpen && (
        <button
          style={floatingPill}
          onClick={() => setPanelOpen(true)}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "var(--shadow-lg)")
          }
        >
          <span style={pillLogo}>
            Baki<span style={{ color: "var(--accent)" }}>Move</span>
          </span>
          <span style={pillDivider} />
          <span style={pillText}>Where are you going?</span>
          <span style={pillIcon}>&#x1F50D;</span>
        </button>
      )}

      {/* Left search panel */}
      <SearchPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        stations={stations}
        origin={origin}
        dest={dest}
        mode={mode}
        hour={hour}
        day={day}
        routes={routes}
        context={context}
        recommend={recommend}
        loading={loading}
        error={error}
        rankedData={rankedData}
        onOriginChange={setOriginClear}
        onDestChange={setDestClear}
        onModeChange={setMode}
        onHourChange={setHour}
        onDayChange={setDay}
        onSearch={search}
        onSwap={swapStations}
        onClear={clearRoute}
      />

      {/* Right station detail panel */}
      <StationDetail
        stationId={selectedStation}
        stations={stations}
        liveData={liveData}
        dayData={dayData}
        onClose={() => setSelectedStation(null)}
        onDirectionsFrom={handleDirectionsFrom}
        onDirectionsTo={handleDirectionsTo}
      />
    </>
  );
}

/* ── Floating pill styles ── */

const floatingPill = {
  position: "fixed",
  top: 16,
  left: 16,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 20px",
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 50,
  boxShadow: "var(--shadow-lg)",
  fontSize: 15,
  cursor: "pointer",
  transition: "box-shadow 0.2s",
  outline: "none",
};

const pillLogo = {
  fontWeight: 700,
  fontSize: 17,
  letterSpacing: "-0.5px",
  whiteSpace: "nowrap",
};

const pillDivider = {
  width: 1,
  height: 20,
  background: "var(--border)",
};

const pillText = {
  color: "var(--text-muted)",
  fontWeight: 400,
  whiteSpace: "nowrap",
};

const pillIcon = {
  fontSize: 16,
  opacity: 0.5,
};
