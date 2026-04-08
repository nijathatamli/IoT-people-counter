import CongestionBadge from "./CongestionBadge.jsx";

const card = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  boxShadow: "var(--shadow-sm)",
};

const title = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--accent)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const bigTime = {
  fontSize: 36,
  fontWeight: 700,
  letterSpacing: "-1px",
};

const infoRow = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
};

const infoItem = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const infoLabel = {
  fontSize: 11,
  color: "var(--text-muted)",
  textTransform: "uppercase",
};

const infoValue = {
  fontSize: 16,
  fontWeight: 600,
};

const reasoning = {
  fontSize: 13,
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  padding: "12px 16px",
  background: "var(--bg-hover)",
  borderRadius: "var(--radius-sm)",
  borderLeft: "3px solid var(--accent)",
};

const contextRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const contextBadge = {
  fontSize: 12,
  padding: "3px 8px",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg-hover)",
  color: "var(--text-secondary)",
};

export default function RecommendCard({ data }) {
  if (!data) return null;

  return (
    <div style={card}>
      <div style={title}>Recommended Departure</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={bigTime}>
          {String(data.optimal_hour).padStart(2, "0")}:00
        </span>
        <CongestionBadge
          label={data.congestion_label}
          score={data.predicted_load}
        />
      </div>

      <div style={infoRow}>
        <div style={infoItem}>
          <span style={infoLabel}>Mode</span>
          <span style={infoValue}>{data.recommended_mode}</span>
        </div>
        <div style={infoItem}>
          <span style={infoLabel}>Current Load</span>
          <span style={infoValue}>{data.current_load?.toFixed(2)}</span>
        </div>
        <div style={infoItem}>
          <span style={infoLabel}>Hours Until Optimal</span>
          <span style={infoValue}>{data.hours_until_optimal}h</span>
        </div>
      </div>

      {data.reasoning && <div style={reasoning}>{data.reasoning}</div>}

      {data.context && (
        <div style={contextRow}>
          {data.context.weather && (
            <span style={contextBadge}>Weather: {data.context.weather}</span>
          )}
          {data.context.is_holiday && (
            <span style={contextBadge}>Holiday</span>
          )}
          {data.context.events_nearby?.map((e, i) => (
            <span key={i} style={contextBadge}>
              {e}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
