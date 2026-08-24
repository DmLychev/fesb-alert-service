import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import fetchDashboard from "../api/fetchDashboard";
import { DASHBOARD_RANGES } from "../dashboardRanges";
import dashboardReducer from "../dashboardReducer";
import {
  type DashboardFilterOptions,
  type DashboardFilters,
  type DashboardLiveEvent,
  type DashboardRangeKey,
} from "../types";

import useDashboardLiveUpdates from "./useDashboardLiveUpdates";
import {
  getDashboardPreferences,
  saveDashboardPreference,
  DEFAULT_DASHBOARD_FILTERS,
} from "../dashboardPreferences";
import fetchDashboardFilterOptions from "../api/fetchDashboardFilterOptions";

const RECONCILE_INTERVAL_MS = 5 * 60 * 1000;

const useDashboard = () => {
  const preferences = getDashboardPreferences();

  const isDashboardRangeKey = (value: unknown): value is DashboardRangeKey =>
    typeof value === "string" && value in DASHBOARD_RANGES;

  const savedRange = isDashboardRangeKey(preferences.rangeKey)
    ? preferences.rangeKey
    : "hour";

  const [rangeKey, setRangeKeyState] = useState<DashboardRangeKey>(savedRange);

  const [filters, setFiltersState] = useState<DashboardFilters>(
    preferences.filters ?? DEFAULT_DASHBOARD_FILTERS,
  );

  const setRangeKey = useCallback((value: DashboardRangeKey) => {
    setRangeKeyState(value);

    saveDashboardPreference("rangeKey", value);
  }, []);

  const setFilters = useCallback((value: DashboardFilters) => {
    setFiltersState(value);

    saveDashboardPreference("filters", value);
  }, []);

  const [dashboard, dispatch] = useReducer(dashboardReducer, null);

  const [filterOptions, setFilterOptions] =
    useState<DashboardFilterOptions | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const lastRefreshRef = useRef(0);
  const requestNumberRef = useRef(0);

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isLiveEnabled, setIsLiveEnabledState] = useState(
    preferences.liveEnabled ?? false,
  );

  const refreshFilterOptions = useCallback(async () => {
    const options = await fetchDashboardFilterOptions();

    setFilterOptions(options);
  }, []);

  const refreshDashboard = useCallback(() => {
    const requestNumber = ++requestNumberRef.current;

    refreshFilterOptions()
      .then(() => fetchDashboard(rangeKey, filters))
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
  }, [rangeKey, filters, refreshFilterOptions]);

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
    onReconnect: refreshDashboard,
  });

  useEffect(() => {
    if (!isLiveEnabled) {
      return;
    }

    const timer = setInterval(refreshDashboard, RECONCILE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [refreshDashboard, isLiveEnabled]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

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
        refreshDashboard();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshDashboard, isLiveEnabled]);

  const setIsLiveEnabled = useCallback(
    (enabled: boolean) => {
      setIsLiveEnabledState(enabled);

      saveDashboardPreference("liveEnabled", enabled);

      if (enabled) {
        refreshDashboard();
      }
    },
    [refreshDashboard],
  );

  return {
    dashboard,

    rangeKey,
    setRangeKey,

    filters,
    setFilters,

    filterOptions,

    liveStatus,
    loading,
    error,
    refreshDashboard,
    lastUpdatedAt,

    isLiveEnabled,
    setIsLiveEnabled,
  };
};

export default useDashboard;
