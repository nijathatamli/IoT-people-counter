import { CONGESTION_COLORS, CONGESTION_BG } from "../constants";

const badge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: "var(--radius-sm)",
  fontSize: 13,
  fontWeight: 600,
};

const dot = {
  width: 8,
  height: 8,
  borderRadius: "50%",
};

export default function CongestionBadge({ label, score }) {
  const color = CONGESTION_COLORS[label] || "var(--text-muted)";
  const bg = CONGESTION_BG[label] || "transparent";

  return (
    <span style={{ ...badge, color, background: bg }}>
      <span style={{ ...dot, background: color }} />
      {label}
      {score !== undefined && (
        <span style={{ fontWeight: 400, opacity: 0.8 }}>
          {" "}
          ({score.toFixed(2)})
        </span>
      )}
    </span>
  );
}
