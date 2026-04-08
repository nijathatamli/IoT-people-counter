import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BAKU_CENTER, LINE_COLORS } from "../constants";

function getCongestionColor(score) {
  if (score === undefined || score === null) return null;
  if (score < 0.35) return "#16a34a";
  if (score < 0.6) return "#d97706";
  if (score < 0.8) return "#dc2626";
  return "#b91c1c";
}

function stationIcon(color, size, pulse) {
  const cls = pulse ? "marker-peak" : "";
  return L.divIcon({
    className: "",
    html: `<div class="${cls}" style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2.5px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,0.25);
      transition: all 0.3s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function selectedIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 10px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    "><div style="width:6px;height:6px;border-radius:50%;background:#fff;"></div></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function originIcon() {
  return selectedIcon("#3b82f6");
}

function destIcon() {
  return selectedIcon("#16a34a");
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
    }
  }, [map, JSON.stringify(bounds)]);
  return null;
}

export default function RouteMap({
  stations,
  network,
  origin,
  dest,
  routes,
  congestionMap,
  selectedStation,
  onStationClick,
}) {
  const stationMap = useMemo(() => {
    const m = {};
    stations.forEach((s) => (m[s.id] = s));
    return m;
  }, [stations]);

  const originStation = stationMap[origin];
  const destStation = stationMap[dest];

  // Fit bounds
  const bounds = useMemo(() => {
    if (originStation && destStation) {
      return [
        [originStation.lat, originStation.lng],
        [destStation.lat, destStation.lng],
      ];
    }
    if (stations.length > 0) {
      return stations.map((s) => [s.lat, s.lng]);
    }
    return null;
  }, [originStation, destStation, stations]);

  // Metro line background polylines
  const linePolylines = useMemo(() => {
    if (!network?.lines) return [];
    return network.lines.map((line) => {
      const coords = line.stations
        .map((id) => stationMap[id])
        .filter(Boolean)
        .map((s) => [s.lat, s.lng]);
      return {
        id: line.id,
        color: line.color || LINE_COLORS[line.id] || "#999",
        coords,
      };
    });
  }, [network, stationMap]);

  // Route polylines from best route
  const routePolylines = useMemo(() => {
    if (!routes || routes.length === 0) return [];
    const best = routes[0];
    if (!best.steps) return [];

    const segments = [];
    let currentLine = null;
    let currentCoords = [];
    let currentColor = "#3b82f6";

    for (const step of best.steps) {
      if (step.type === "walk") {
        if (currentCoords.length >= 2) {
          segments.push({
            coords: [...currentCoords],
            color: currentColor,
            dash: false,
          });
        }
        currentCoords = [];
        currentLine = null;
        const fromSt = stationMap[step.from];
        const toSt = stationMap[step.to];
        if (fromSt && toSt) {
          segments.push({
            coords: [
              [fromSt.lat, fromSt.lng],
              [toSt.lat, toSt.lng],
            ],
            color: "#8d96a3",
            dash: true,
          });
        }
        continue;
      }

      const lineId = step.line;
      if (lineId !== currentLine) {
        if (currentCoords.length >= 2) {
          segments.push({
            coords: [...currentCoords],
            color: currentColor,
            dash: false,
          });
        }
        currentLine = lineId;
        currentColor = LINE_COLORS[lineId] || "#3b82f6";
        const fromSt = stationMap[step.from];
        currentCoords = fromSt ? [[fromSt.lat, fromSt.lng]] : [];
      }

      const toSt = stationMap[step.to];
      if (toSt) {
        currentCoords.push([toSt.lat, toSt.lng]);
      }
    }

    if (currentCoords.length >= 2) {
      segments.push({ coords: currentCoords, color: currentColor, dash: false });
    }

    return segments;
  }, [routes, stationMap]);

  const hasRoute = routePolylines.length > 0;

  return (
    <MapContainer
      center={BAKU_CENTER}
      zoom={12}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
      }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {bounds && <FitBounds bounds={bounds} />}

      {/* Metro line backgrounds */}
      {linePolylines.map((lp) => (
        <Polyline
          key={lp.id}
          positions={lp.coords}
          pathOptions={{
            color: lp.color,
            weight: hasRoute ? 2 : 4,
            opacity: hasRoute ? 0.2 : 0.45,
          }}
        />
      ))}

      {/* Active route */}
      {routePolylines.map((seg, i) => (
        <Polyline
          key={`route-${i}`}
          positions={seg.coords}
          pathOptions={{
            color: seg.color,
            weight: 6,
            opacity: 0.9,
            dashArray: seg.dash ? "8 8" : undefined,
          }}
        />
      ))}

      {/* Station markers */}
      {stations.map((s) => {
        const isOrigin = s.id === origin;
        const isDest = s.id === dest;
        const isSelected = s.id === selectedStation;
        const congestion = congestionMap?.[s.id];
        const congColor = getCongestionColor(congestion);
        const lineColor = s.lines?.[0]
          ? LINE_COLORS[s.lines[0]] || "#3b82f6"
          : "#3b82f6";

        // Determine marker appearance
        let icon;
        if (isOrigin) {
          icon = originIcon();
        } else if (isDest) {
          icon = destIcon();
        } else if (isSelected) {
          icon = selectedIcon(congColor || lineColor);
        } else {
          const color = congColor || lineColor;
          const size = s.is_interchange ? 14 : 11;
          const isPeak = congestion >= 0.8;
          icon = stationIcon(color, size, isPeak);
        }

        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onStationClick?.(s.id),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              opacity={0.95}
            >
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  padding: "2px 4px",
                }}
              >
                {s.name}
                {congestion !== undefined && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      color: congColor,
                      fontWeight: 600,
                    }}
                  >
                    {congestion.toFixed(2)}
                  </span>
                )}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
