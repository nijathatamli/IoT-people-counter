import { CONGESTION_COLORS } from "../constants";

function getLabel(score) {
  if (score < 0.35) return "Low";
  if (score < 0.6) return "Moderate";
  if (score < 0.8) return "High";
  return "Peak";
}

function getBarColor(score) {
  return CONGESTION_COLORS[getLabel(score)];
}

const container = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: 20,
  boxShadow: "var(--shadow-sm)",
};

const chartArea = {
  display: "flex",
  alignItems: "flex-end",
  gap: 3,
  height: 160,
  paddingTop: 8,
};

const hourLabelStyle = {
  fontSize: 10,
  color: "var(--text-muted)",
  textAlign: "center",
  marginTop: 4,
};

export default function HourlyChart({ hourly, currentHour, compact }) {
  if (!hourly || hourly.length === 0) {
    return (
      <div style={container}>
        <div
          style={{
            color: "var(--text-muted)",
            textAlign: "center",
            padding: 40,
          }}
        >
          No data
        </div>
      </div>
    );
  }

  const maxScore = Math.max(...hourly.map((h) => h.score), 0.01);

  return (
    <div style={compact ? { ...container, padding: 0, border: "none", boxShadow: "none", background: "transparent" } : container}>
      {!compact && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: 12,
          }}
        >
          24-Hour Congestion Forecast
        </div>
      )}
      <div style={compact ? { ...chartArea, height: 100 } : chartArea}>
        {hourly.map((h) => {
          const pct = (h.score / maxScore) * 100;
          const isCurrent = h.hour === currentHour;
          return (
            <div
              key={h.hour}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  width: "100%",
                  minHeight: 2,
                  height: `${pct}%`,
                  background: getBarColor(h.score),
                  borderRadius: "3px 3px 0 0",
                  opacity: isCurrent ? 1 : 0.6,
                  border: isCurrent
                    ? "2px solid var(--text-primary)"
                    : "none",
                  transition: "height 0.3s",
                }}
                title={`${String(h.hour).padStart(2, "0")}:00 — ${h.score.toFixed(2)} (${getLabel(h.score)})`}
              />
              <div style={hourLabelStyle}>
                {h.hour % 3 === 0 ? `${h.hour}` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
