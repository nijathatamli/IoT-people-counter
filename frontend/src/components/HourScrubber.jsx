const wrapper = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const label = {
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text-secondary)",
  minWidth: 48,
};

const slider = {
  flex: 1,
  accentColor: "var(--accent)",
  height: 6,
};

export default function HourScrubber({ value, onChange }) {
  const display = `${String(value).padStart(2, "0")}:00`;

  return (
    <div style={wrapper}>
      <span style={label}>{display}</span>
      <input
        type="range"
        min={0}
        max={23}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={slider}
      />
    </div>
  );
}
