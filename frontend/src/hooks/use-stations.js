import { useState, useEffect } from "react";
import { getStations } from "../api";

let cachedStations = null;

export default function useStations() {
  const [stations, setStations] = useState(cachedStations?.stations || []);
  const [loading, setLoading] = useState(!cachedStations);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedStations) return;
    let cancelled = false;
    getStations()
      .then((data) => {
        if (cancelled) return;
        cachedStations = data;
        setStations(data.stations);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { stations, loading, error };
}
