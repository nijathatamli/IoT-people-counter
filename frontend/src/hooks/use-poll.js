import { useState, useEffect, useRef, useCallback } from "react";

export default function usePoll(fetchFn, intervalMs = 3000, enabled = true) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setData(result);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    execute();
    timerRef.current = setInterval(execute, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [execute, intervalMs, enabled]);

  return { data, error, loading, refetch: execute };
}
