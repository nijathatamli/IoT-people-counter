import CongestionBadge from "./CongestionBadge.jsx";
import RouteCard from "./RouteCard.jsx";
import RecommendCard from "./RecommendCard.jsx";
import HourScrubber from "./HourScrubber.jsx";
import { MODE_LABELS, MODE_ICONS, DAYS, LINE_COLORS } from "../constants";

const MODES = Object.keys(MODE_LABELS);

const panel = {
  height: "100%",
  background: "var(--bg-card)",
  borderRight: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  boxShadow: "4px 0 24px rgba(0,0,0,0.08)",
};

const header = {
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid var(--border)",
  flexShrink: 0,
};

const logo = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: "-0.5px",
};

const closeBtn = {
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "var(--bg-hover)",
  borderRadius: "50%",
  fontSize: 18,
  color: "var(--text-secondary)",
  transition: "background 0.15s",
};

const section = {
  padding: "16px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  flexShrink: 0,
};

const inputRow = {
  display: "flex",
  alignItems: "stretch",
  gap: 8,
};

const stationInputs = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

const selectStyle = {
  padding: "12px 14px",
  background: "var(--bg-primary)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  width: "100%",
};

const swapBtn = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  border: "1px solid var(--border)",
  background: "var(--bg-hover)",
  borderRadius: "var(--radius-sm)",
  fontSize: 18,
  color: "var(--text-secondary)",
  cursor: "pointer",
  flexShrink: 0,
  transition: "background 0.15s",
};

const optionsRow = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  alignItems: "center",
};

const modeBtn = {
  padding: "5px 10px",
  border: "1px solid var(--border)",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: 4,
  transition: "all 0.15s",
  whiteSpace: "nowrap",
};

const modeActive = {
  ...modeBtn,
  background: "var(--accent)",
  borderColor: "var(--accent)",
  color: "#fff",
};

const modeInactive = {
  ...modeBtn,
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
};

const timeRow = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const daySelectStyle = {
  padding: "8px 10px",
  background: "var(--bg-primary)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontSize: 13,
};

const searchBtnStyle = {
  padding: "12px 20px",
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-sm)",
  fontSize: 14,
  fontWeight: 600,
  width: "100%",
  transition: "background 0.15s",
};

const divider = {
  height: 1,
  background: "var(--border)",
  margin: "0 20px",
  flexShrink: 0,
};

const scrollArea = {
  flex: 1,
  overflowY: "auto",
  padding: "16px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const emptyState = {
  textAlign: "center",
  padding: "40px 20px",
  color: "var(--text-muted)",
  fontSize: 14,
};

const contextBadge = {
  fontSize: 12,
  padding: "3px 8px",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg-hover)",
  color: "var(--text-secondary)",
};

/* Ranking mini-table styles */
const rankRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: "var(--radius-sm)",
  transition: "background 0.15s",
  cursor: "default",
};

const rankNum = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-muted)",
  width: 22,
  textAlign: "center",
};

const rankName = {
  flex: 1,
  fontSize: 14,
  fontWeight: 500,
};

const rankDot = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  display: "inline-block",
  marginRight: 3,
};

const rankScore = {
  fontSize: 12,
  color: "var(--text-muted)",
  minWidth: 36,
  textAlign: "right",
};

const sectionTitle = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 4,
};

export default function SearchPanel({
  open,
  onClose,
  stations,
  origin,
  dest,
  mode,
  hour,
  day,
  routes,
  context,
  recommend,
  loading,
  error,
  rankedData,
  onOriginChange,
  onDestChange,
  onModeChange,
  onHourChange,
  onDayChange,
  onSearch,
  onSwap,
  onClear,
}) {
  const canSearch = origin && dest && origin !== dest;
  const hasResults = routes || error;

  return (
    <div className={`panel-left${open ? " open" : ""}`}>
      <div style={panel}>
        {/* Header */}
        <div style={header}>
          <div style={logo}>
            Baki<span style={{ color: "var(--accent)" }}>Move</span>
          </div>
          <button
            style={closeBtn}
            onClick={onClose}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--border)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
          >
            &#x2715;
          </button>
        </div>

        {/* Search inputs */}
        <div style={section}>
          <div style={inputRow}>
            <div style={stationInputs}>
              <select
                style={{
                  ...selectStyle,
                  borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                  borderBottom: "none",
                }}
                value={origin}
                onChange={(e) => onOriginChange(e.target.value)}
              >
                <option value="">From — Select origin</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                style={{
                  ...selectStyle,
                  borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                }}
                value={dest}
                onChange={(e) => onDestChange(e.target.value)}
              >
                <option value="">To — Select destination</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              style={swapBtn}
              onClick={onSwap}
              title="Swap origin and destination"
            >
              &#8645;
            </button>
          </div>

          {origin && dest && origin === dest && (
            <div style={{ fontSize: 12, color: "var(--yellow)" }}>
              Origin and destination must differ
            </div>
          )}

          {/* Mode pills */}
          <div style={optionsRow}>
            {MODES.map((m) => (
              <button
                key={m}
                style={m === mode ? modeActive : modeInactive}
                onClick={() => onModeChange(m)}
              >
                <span>{MODE_ICONS[m]}</span>
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Time controls */}
          <div style={timeRow}>
            <select
              style={daySelectStyle}
              value={day}
              onChange={(e) => onDayChange(Number(e.target.value))}
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <div style={{ flex: 1 }}>
              <HourScrubber value={hour} onChange={onHourChange} />
            </div>
          </div>

          {/* Search button */}
          <button
            style={{
              ...searchBtnStyle,
              opacity: canSearch && !loading ? 1 : 0.5,
              cursor: canSearch && !loading ? "pointer" : "not-allowed",
            }}
            onClick={onSearch}
            disabled={!canSearch || loading}
          >
            {loading ? "Searching..." : "Find Routes"}
          </button>

          {/* Clear results link */}
          {hasResults && (
            <button
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: 13,
                textAlign: "center",
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={onClear}
            >
              Clear results
            </button>
          )}
        </div>

        <div style={divider} />

        {/* Scrollable results / rankings area */}
        <div style={scrollArea} className="panel-scroll">
          {/* Error */}
          {error && (
            <div
              style={{
                padding: 14,
                background: "rgba(220,38,38,0.06)",
                border: "1px solid var(--red)",
                borderRadius: "var(--radius-sm)",
                color: "var(--red)",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Recommendation */}
          {recommend && <RecommendCard data={recommend} />}

          {/* Context badges */}
          {context && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {context.weather && (
                <span style={contextBadge}>Weather: {context.weather}</span>
              )}
              {context.events_nearby?.map((e, i) => (
                <span key={i} style={contextBadge}>
                  {e}
                </span>
              ))}
            </div>
          )}

          {/* Route cards */}
          {routes &&
            routes.map((r, i) => <RouteCard key={i} route={r} />)}

          {routes && routes.length === 0 && (
            <div style={emptyState}>No routes found for this combination</div>
          )}

          {/* Default: station rankings */}
          {!hasResults && rankedData?.ranked && (
            <div>
              <div style={sectionTitle}>Live Station Congestion</div>
              {rankedData.ranked.slice(0, 15).map((s) => (
                <div
                  key={s.station_id}
                  style={rankRow}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span style={rankNum}>{s.rank}</span>
                  <span style={rankName}>
                    {s.lines?.map((l) => (
                      <span
                        key={l}
                        style={{
                          ...rankDot,
                          background: LINE_COLORS[l] || "var(--text-muted)",
                        }}
                      />
                    ))}
                    {s.name}
                  </span>
                  <CongestionBadge
                    label={s.congestion_label}
                    score={s.congestion_score}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!hasResults && !rankedData && (
            <div style={emptyState}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>
                &#x1F68C;
              </div>
              Plan your trip across Baku's transit network
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
