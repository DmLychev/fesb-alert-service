import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import fetchDashboard from "../api/fetchDashboard";
import fetchDashboardFilterOptions from "../api/fetchDashboardFilterOptions";
import {
  DEFAULT_DASHBOARD_FILTERS,
  getDashboardPreferences,
  saveDashboardPreference,
} from "../dashboardPreferences";
import { DASHBOARD_RANGES } from "../dashboardRanges";
import dashboardReducer from "../dashboardReducer";

import type {
  DashboardFilterOptions,
  DashboardFilters,
  DashboardLiveEvent,
  DashboardRangeKey,
} from "../types";

import useDashboardLiveUpdates from "./useDashboardLiveUpdates";

const RECONCILE_INTERVAL_MS = 5 * 60 * 1000;

/*
 * With filters enabled, message WS events cannot be safely applied locally,
 * because their payload does not contain route/domain dimensions.
 *
 * Collapse bursts into at most one filtered snapshot request every 2 seconds.
 */
const FILTERED_LIVE_REFRESH_INTERVAL_MS = 2_000;

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

  /*
   * Keep the current filters available to the stable filter-options loader.
   * This lets us validate saved selections without making
   * refreshFilterOptions depend on filters.
   */
  const filtersRef = useRef(filters);

  const setRangeKey = useCallback((value: DashboardRangeKey) => {
    setRangeKeyState(value);

    saveDashboardPreference("rangeKey", value);
  }, []);

  const setFilters = useCallback((value: DashboardFilters) => {
    filtersRef.current = value;

    setFiltersState(value);

    saveDashboardPreference("filters", value);
  }, []);

  const [filterOptions, setFilterOptions] =
    useState<DashboardFilterOptions | null>(null);

  const [dashboard, dispatch] = useReducer(dashboardReducer, null);

  const [loading, setLoading] = useState(true);

  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [filterOptionsError, setFilterOptionsError] = useState<string | null>(
    null,
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastRefreshRef = useRef(0);
  const requestNumberRef = useRef(0);

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const [isLiveEnabled, setIsLiveEnabledState] = useState(
    preferences.liveEnabled ?? false,
  );

  /*
   * Dashboard snapshot only.
   *
   * Used for:
   * - initial snapshot
   * - range/filter changes
   * - reconciliation
   * - reconnect
   * - stale-tab recovery
   * - enabling Live
   *
   * Does NOT refresh the domain/route catalogue.
   */
  const refreshDashboard = useCallback(() => {
    const requestNumber = ++requestNumberRef.current;

    return fetchDashboard(rangeKey, filters)
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

        setDashboardError(null);
      })
      .catch((error: unknown) => {
        if (requestNumber !== requestNumberRef.current) {
          return;
        }

        setDashboardError(
          error instanceof Error ? error.message : "Dashboard request failed",
        );
      })
      .finally(() => {
        if (requestNumber === requestNumberRef.current) {
          setLoading(false);
        }
      });
  }, [rangeKey, filters]);

  /*
   * Catalogue only.
   *
   * Called:
   * - once when Dashboard opens
   * - on explicit manual Refresh
   */
  const refreshFilterOptions = useCallback(() => {
    return fetchDashboardFilterOptions()
      .then((options) => {
        setFilterOptions(options);

        /*
         * Clean saved filters if a route/domain disappeared from DB.
         */
        const current = filtersRef.current;

        const availableDomains = new Set(options.domains);

        const domains = current.domains.filter((domain) =>
          availableDomains.has(domain),
        );

        const availableRouteIds = new Set(
          options.routes
            .filter(
              (route) =>
                domains.length === 0 || domains.includes(route.domainName),
            )
            .map((route) => route.id),
        );

        const routeIds = current.routeIds.filter((routeId) =>
          availableRouteIds.has(routeId),
        );

        const changed =
          domains.length !== current.domains.length ||
          routeIds.length !== current.routeIds.length;

        if (changed) {
          const sanitizedFilters: DashboardFilters = {
            domains,
            routeIds,
          };

          filtersRef.current = sanitizedFilters;

          setFiltersState(sanitizedFilters);

          saveDashboardPreference("filters", sanitizedFilters);
        }

        setFilterOptionsError(null);
      })
      .catch((error: unknown) => {
        setFilterOptionsError(
          error instanceof Error
            ? error.message
            : "Не удалось получить список фильтров Dashboard",
        );
      });
  }, []);

  /*
   * This is the function exposed as the Refresh button action.
   *
   * It is deliberately NOT used by reconciliation/live reconnect etc.
   */
  const refresh = useCallback(() => {
    setIsRefreshing(true);

    void Promise.all([refreshDashboard(), refreshFilterOptions()]).finally(
      () => {
        setIsRefreshing(false);
      },
    );
  }, [refreshDashboard, refreshFilterOptions]);

  /*
   * Initial snapshot + every explicit range/filter change.
   */
  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  /*
   * Catalogue only once on initial Dashboard opening.
   */
  useEffect(() => {
    void refreshFilterOptions();
  }, [refreshFilterOptions]);

  /*
   * See Phase 5 below for why filtered dashboards require snapshot refreshes
   * instead of blindly applying all message deltas.
   */
  const refreshDashboardRef = useRef(refreshDashboard);

  useEffect(() => {
    refreshDashboardRef.current = refreshDashboard;
  }, [refreshDashboard]);

  const filteredLiveRefreshTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const scheduleFilteredLiveRefresh = useCallback(() => {
    if (filteredLiveRefreshTimerRef.current) {
      return;
    }

    filteredLiveRefreshTimerRef.current = setTimeout(() => {
      filteredLiveRefreshTimerRef.current = null;

      void refreshDashboardRef.current();
    }, FILTERED_LIVE_REFRESH_INTERVAL_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (filteredLiveRefreshTimerRef.current) {
        clearTimeout(filteredLiveRefreshTimerRef.current);
      }
    };
  }, []);

  const handleLiveEvent = useCallback(
    (event: DashboardLiveEvent) => {
      const hasBusinessFilters =
        filters.domains.length > 0 || filters.routeIds.length > 0;

      /*
       * FESB request health is filter-independent, so its existing incremental
       * reducer update remains valid even on a filtered dashboard.
       */
      if (hasBusinessFilters && event.type !== "requests_created") {
        scheduleFilteredLiveRefresh();
        return;
      }

      /*
       * Unfiltered Dashboard can continue using the efficient incremental
       * reducer you already implemented.
       */
      dispatch({
        type: "live_event",
        event,
        rangeKey,
        now: Date.now(),
      });

      setLastUpdatedAt(new Date().toISOString());
    },
    [filters.domains.length, filters.routeIds.length, rangeKey, scheduleFilteredLiveRefresh],
  );

  const liveStatus = useDashboardLiveUpdates({
    enabled: isLiveEnabled,
    onEvent: handleLiveEvent,
    onReconnect: refreshDashboard,
  });

  /*
   * Reconciliation belongs only to Live mode.
   */
  useEffect(() => {
    if (!isLiveEnabled) {
      return;
    }

    const timer = setInterval(refreshDashboard, RECONCILE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [refreshDashboard, isLiveEnabled]);

  /*
   * Rolling window also belongs to Live mode.
   */
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

  /*
   * Recover stale Live Dashboard after returning to the browser tab.
   */
  useEffect(() => {
    const handleVisibility = () => {
      if (!isLiveEnabled || document.visibilityState !== "visible") {
        return;
      }

      const staleFor = Date.now() - lastRefreshRef.current;

      if (staleFor > RECONCILE_INTERVAL_MS) {
        void refreshDashboard();
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
        void refreshDashboard();
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
    isRefreshing,

    error: dashboardError ?? filterOptionsError,

    refresh,
    lastUpdatedAt,

    isLiveEnabled,
    setIsLiveEnabled,
  };
};

export default useDashboard;
