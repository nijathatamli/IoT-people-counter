import { useState } from "react";
import CongestionBadge from "./CongestionBadge.jsx";
import HourlyChart from "./HourlyChart.jsx";
import { LINE_COLORS, ZONE_LABELS } from "../constants";

const panel = {
  height: "100%",
  background: "var(--bg-card)",
  borderLeft: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
};

const header = {
  padding: "16px 20px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  flexShrink: 0,
};

const headerTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 8,
};

const closeBtn = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "var(--bg-hover)",
  borderRadius: "50%",
  fontSize: 16,
  color: "var(--text-secondary)",
  cursor: "pointer",
  flexShrink: 0,
};

const stationName = {
  fontSize: 20,
  fontWeight: 700,
  lineHeight: 1.2,
};

const lineBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "3px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  color: "#fff",
};

const scrollArea = {
  flex: 1,
  overflowY: "auto",
  padding: "16px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const sectionTitle = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 6,
};

const metricGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const metricCard = {
  padding: 14,
  background: "var(--bg-primary)",
  borderRadius: "var(--radius-sm)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const metricLabel = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

const metricValue = {
  fontSize: 24,
  fontWeight: 700,
};

const dirBtn = {
  flex: 1,
  padding: "12px 16px",
  border: "none",
  borderRadius: "var(--radius-sm)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.15s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

const zoneTabs = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
};

const zoneTab = {
  padding: "5px 12px",
  border: "1px solid var(--border)",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s",
};

const zoneTabActive = {
  ...zoneTab,
  background: "var(--accent)",
  borderColor: "var(--accent)",
  color: "#fff",
};

const zoneTabInactive = {
  ...zoneTab,
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
};

const staleTag = {
  fontSize: 11,
  color: "var(--yellow)",
  fontWeight: 500,
};

const sourceTag = {
  fontSize: 11,
  color: "var(--text-muted)",
  padding: "2px 8px",
  background: "var(--bg-hover)",
  borderRadius: 4,
};

const ZONES = ["all", ...Object.keys(ZONE_LABELS)];

export default function StationDetail({
  stationId,
  stations,
  liveData,
  dayData,
  onClose,
  onDirectionsFrom,
  onDirectionsTo,
}) {
  const [zone, setZone] = useState("all");
  const station = stations.find((s) => s.id === stationId);
  const currentHour = new Date().getHours();

  if (!station) {
    return (
      <div className={`panel-right${stationId ? " open" : ""}`}>
        <div style={panel} />
      </div>
    );
  }

  return (
    <div className={`panel-right${stationId ? " open" : ""}`}>
      <div style={panel}>
        {/* Header */}
        <div style={header}>
          <div style={headerTop}>
            <div>
              <div style={stationName}>{station.name}</div>
              {station.name_az && station.name_az !== station.name && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {station.name_az}
                </div>
              )}
            </div>
            <button style={closeBtn} onClick={onClose}>
              &#x2715;
            </button>
          </div>

          {/* Line badges */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {station.lines?.map((l) => (
              <span
                key={l}
                style={{
                  ...lineBadge,
                  background: LINE_COLORS[l] || "var(--text-muted)",
                }}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)} Line
              </span>
            ))}
            {station.is_interchange && (
              <span
                style={{
                  ...lineBadge,
                  background: "var(--bg-hover)",
                  color: "var(--text-secondary)",
                }}
              >
                Interchange
              </span>
            )}
          </div>

          {/* Quick congestion status */}
          {liveData && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <CongestionBadge
                label={liveData.congestion_label}
                score={liveData.density_score}
              />
              {liveData.stale && <span style={staleTag}>STALE</span>}
              <span style={sourceTag}>Source: {liveData.source}</span>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div style={scrollArea} className="panel-scroll">
          {/* Direction buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{
                ...dirBtn,
                background: "var(--accent)",
                color: "#fff",
              }}
              onClick={() => onDirectionsFrom(stationId)}
            >
              &#x2794; Directions from here
            </button>
            <button
              style={{
                ...dirBtn,
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
              onClick={() => onDirectionsTo(stationId)}
            >
              &#x2794; Directions to here
            </button>
          </div>

          {/* Loading state */}
          {!liveData && (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              Loading station data...
            </div>
          )}

          {/* Zone tabs */}
          {liveData && (
            <div>
              <div style={sectionTitle}>Zones</div>
              <div style={zoneTabs}>
                {ZONES.map((z) => (
                  <button
                    key={z}
                    style={z === zone ? zoneTabActive : zoneTabInactive}
                    onClick={() => setZone(z)}
                  >
                    {z === "all" ? "All" : ZONE_LABELS[z]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zone metrics */}
          {liveData && zone === "all" && liveData.zones && (
            <div style={metricGrid}>
              {Object.entries(liveData.zones).map(([key, val]) => (
                <div key={key} style={metricCard}>
                  <span style={metricLabel}>
                    {ZONE_LABELS[key] || key}
                  </span>
                  <span style={metricValue}>{val.person_count}</span>
                  <CongestionBadge
                    label={val.label}
                    score={val.density_score}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Single zone view */}
          {liveData && zone !== "all" && (
            <div style={metricGrid}>
              <div style={metricCard}>
                <span style={metricLabel}>Person Count</span>
                <span style={metricValue}>{liveData.person_count}</span>
              </div>
              <div style={metricCard}>
                <span style={metricLabel}>Density Score</span>
                <span style={metricValue}>
                  {liveData.density_score?.toFixed(2)}
                </span>
              </div>
              {liveData.ml_prediction && (
                <div style={{ ...metricCard, gridColumn: "1 / -1" }}>
                  <span style={metricLabel}>ML Prediction</span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CongestionBadge
                      label={liveData.ml_prediction.label}
                      score={liveData.ml_prediction.score}
                    />
                    <span
                      style={{ fontSize: 12, color: "var(--text-muted)" }}
                    >
                      Confidence:{" "}
                      {(liveData.ml_prediction.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hourly forecast */}
          {dayData?.hourly && (
            <div>
              <div style={sectionTitle}>24-Hour Forecast</div>
              <HourlyChart
                hourly={dayData.hourly}
                currentHour={currentHour}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
