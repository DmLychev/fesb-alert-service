import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import fetchDashboard from "../api/fetchDashboard";
import { DASHBOARD_RANGES } from "../dashboardRanges";
import dashboardReducer from "../dashboardReducer";
import type { DashboardLiveEvent, DashboardRangeKey } from "../types";

import useDashboardLiveUpdates from "./useDashboardLiveUpdates";
import {
  getDashboardPreferences,
  saveDashboardPreference,
} from "../dashboardPreferences";

const RECONCILE_INTERVAL_MS = 5 * 60 * 1000;

const useDashboard = () => {
  const preferences = getDashboardPreferences();

  const isDashboardRangeKey = (value: unknown): value is DashboardRangeKey =>
    typeof value === "string" && value in DASHBOARD_RANGES;

  const savedRange = isDashboardRangeKey(preferences.rangeKey)
    ? preferences.rangeKey
    : "hour";

  const [rangeKey, setRangeKeyState] = useState<DashboardRangeKey>(savedRange);

  const setRangeKey = useCallback((value: DashboardRangeKey) => {
    setRangeKeyState(value);

    saveDashboardPreference("rangeKey", value);
  }, []);

  const [dashboard, dispatch] = useReducer(dashboardReducer, null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const lastRefreshRef = useRef(0);
  const requestNumberRef = useRef(0);

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isLiveEnabled, setIsLiveEnabledState] = useState(
    preferences.liveEnabled ?? false,
  );

  const refresh = useCallback(() => {
    const requestNumber = ++requestNumberRef.current;

    fetchDashboard(rangeKey)
      .then((snapshot) => {
        if (requestNumber !== requestNumberRef.current) {
          return;
        }

        dispatch({
          type: "snapshot",
          snapshot,
        });

        setLastUpdatedAt(snapshot.generatedAt);

        lastRefreshRef.current = Date.now();

        setError(null);
      })
      .catch((error: unknown) => {
        if (requestNumber !== requestNumberRef.current) {
          return;
        }

        setError(
          error instanceof Error ? error.message : "Dashboard request failed",
        );
      })
      .finally(() => {
        if (requestNumber === requestNumberRef.current) {
          setLoading(false);
        }
      });
  }, [rangeKey]);

  const handleLiveEvent = useCallback(
    (event: DashboardLiveEvent) => {
      dispatch({
        type: "live_event",
        event,
        rangeKey,
        now: Date.now(),
      });

      setLastUpdatedAt(new Date().toISOString());
    },
    [rangeKey],
  );

  const liveStatus = useDashboardLiveUpdates({
    enabled: isLiveEnabled,
    onEvent: handleLiveEvent,
    onReconnect: refresh,
  });

  useEffect(() => {
    if (!isLiveEnabled) {
      return;
    }

    const timer = setInterval(refresh, RECONCILE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [refresh, isLiveEnabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isLiveEnabled) {
      return;
    }

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
  }, [rangeKey, isLiveEnabled]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!isLiveEnabled || document.visibilityState !== "visible") {
        return;
      }

      const staleFor = Date.now() - lastRefreshRef.current;

      if (staleFor > RECONCILE_INTERVAL_MS) {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh, isLiveEnabled]);

  const setIsLiveEnabled = useCallback(
    (enabled: boolean) => {
      setIsLiveEnabledState(enabled);

      saveDashboardPreference("liveEnabled", enabled);

      if (enabled) {
        refresh();
      }
    },
    [refresh],
  );

  return {
    dashboard,
    rangeKey,
    setRangeKey,
    liveStatus,
    loading,
    error,
    refresh,
    lastUpdatedAt,
    isLiveEnabled,
    setIsLiveEnabled,
  };
};

export default useDashboard;
