import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import fetchDashboard from "../api/fetchDashboard";
import { DASHBOARD_RANGES } from "../dashboardRanges";
import dashboardReducer from "../dashboardReducer";
import type { DashboardLiveEvent, DashboardRangeKey } from "../types";

import useDashboardLiveUpdates from "./useDashboardLiveUpdates";

const RECONCILE_INTERVAL_MS = 5 * 60 * 1000;

const useDashboard = () => {
  const [rangeKey, setRangeKey] = useState<DashboardRangeKey>("hour");

  const [dashboard, dispatch] = useReducer(dashboardReducer, null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const lastRefreshRef = useRef(0);
  const requestNumberRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestNumber = ++requestNumberRef.current;

    try {
      const snapshot = await fetchDashboard(rangeKey);

      if (requestNumber !== requestNumberRef.current) {
        return;
      }

      dispatch({
        type: "snapshot",
        snapshot,
      });

      lastRefreshRef.current = Date.now();

      setError(null);
    } catch (error: unknown) {
      if (requestNumber !== requestNumberRef.current) {
        return;
      }

      setError(
        error instanceof Error ? error.message : "Dashboard request failed",
      );
    } finally {
      if (requestNumber === requestNumberRef.current) {
        setLoading(false);
      }
    }
  }, [rangeKey]);

  const handleLiveEvent = useCallback(
    (event: DashboardLiveEvent) => {
      dispatch({
        type: "live_event",
        event,
        rangeKey,
        now: Date.now(),
      });
    },
    [rangeKey],
  );

  const liveStatus = useDashboardLiveUpdates({
    onEvent: handleLiveEvent,
    onReconnect: () => {
      void refresh();
    },
  });

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(() => void refresh(), RECONCILE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const range = DASHBOARD_RANGES[rangeKey];

    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const now = Date.now();

      const untilBoundary = range.bucketMs - (now % range.bucketMs);

      timer = setTimeout(() => {
        dispatch({
          type: "roll_window",
          rangeKey,
          now: Date.now(),
        });

        schedule();
      }, untilBoundary + 50);
    };

    schedule();

    return () => clearTimeout(timer);
  }, [rangeKey]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const staleFor = Date.now() - lastRefreshRef.current;

      if (staleFor > RECONCILE_INTERVAL_MS) {
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  return {
    dashboard,
    rangeKey,
    setRangeKey,
    liveStatus,
    loading,
    error,
    refresh,
  };
};

export default useDashboard;
