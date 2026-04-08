import CongestionBadge from "./CongestionBadge.jsx";
import { LINE_COLORS } from "../constants";

const card = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  boxShadow: "var(--shadow-sm)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
};

const rank = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--accent)",
  background: "var(--accent-light)",
  padding: "4px 10px",
  borderRadius: "var(--radius-sm)",
};

const stats = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
};

const stat = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const statLabel = {
  fontSize: 11,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const statValue = {
  fontSize: 18,
  fontWeight: 600,
};

const stepRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  background: "var(--bg-hover)",
  borderRadius: "var(--radius-sm)",
  fontSize: 14,
};

const stepIcon = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 600,
  flexShrink: 0,
};

function formatName(id) {
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function StepRow({ step }) {
  const icons = { metro: "M", bus: "B", walk: "W" };
  const bg =
    step.type === "metro"
      ? LINE_COLORS[step.line] || "var(--accent)"
      : step.type === "walk"
        ? "var(--text-muted)"
        : "var(--yellow)";

  return (
    <div style={stepRow}>
      <div style={{ ...stepIcon, background: bg, color: "#fff" }}>
        {icons[step.type] || "?"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>
          {formatName(step.from)} → {formatName(step.to)}
        </div>
        {step.description && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {step.description}
          </div>
        )}
        {step.line && (
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {step.line} line
          </div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 600 }}>{step.duration_min} min</div>
        {step.congestion_score !== undefined && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            load: {step.congestion_score.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RouteCard({ route }) {
  return (
    <div style={card}>
      <div style={headerStyle}>
        <span style={rank}>Route #{route.rank}</span>
        <CongestionBadge
          label={route.congestion_label}
          score={route.avg_congestion}
        />
      </div>
      <div style={stats}>
        <div style={stat}>
          <span style={statLabel}>Total Time</span>
          <span style={statValue}>{route.total_time_min} min</span>
        </div>
        <div style={stat}>
          <span style={statLabel}>Transfers</span>
          <span style={statValue}>{route.total_transfers}</span>
        </div>
        <div style={stat}>
          <span style={statLabel}>Walking</span>
          <span style={statValue}>{route.total_walking_min} min</span>
        </div>
        <div style={stat}>
          <span style={statLabel}>Modes</span>
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {route.transport_modes?.join(", ")}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {route.steps?.map((step, i) => (
          <StepRow key={i} step={step} />
        ))}
      </div>
    </div>
  );
}
