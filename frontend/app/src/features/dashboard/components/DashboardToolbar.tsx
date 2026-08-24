import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Flex,
  Heading,
  HStack,
  NativeSelect,
  Switch,
  Text,
} from "@chakra-ui/react";

import RefreshButton from "../../../components/RefreshButton";

import { DASHBOARD_RANGES } from "../dashboardRanges";

import type {
  DashboardFilterOptions,
  DashboardFilters,
  DashboardLiveStatus,
  DashboardRangeKey,
} from "../types";

import MultiSelectFilter from "./MultiSelectFilter";
import { formatRelativeTime } from "../relativeTime";
import ResetFilterButton from "./ResetFilterButton";

interface DashboardToolbarProps {
  rangeKey: DashboardRangeKey;
  onRangeChange: (rangeKey: DashboardRangeKey) => void;

  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;

  filterOptions: DashboardFilterOptions | null;

  isRefreshing: boolean;
  onRefresh: () => void;

  liveStatus: DashboardLiveStatus;
  isLiveEnabled: boolean;
  onLiveEnabledChange: (enabled: boolean) => void;

  lastUpdatedAt: string | null;
}

const DashboardToolbar = ({
  rangeKey,
  onRangeChange,

  filters,
  onFiltersChange,

  filterOptions,

  isRefreshing,
  onRefresh,

  liveStatus,
  isLiveEnabled,
  onLiveEnabledChange,

  lastUpdatedAt,
}: DashboardToolbarProps) => {
  const domainOptions = useMemo(
    () =>
      (filterOptions?.domains ?? []).map((domain) => ({
        value: domain,
        label: domain,
      })),
    [filterOptions],
  );

  /*
   * If one or more domains are selected, don't make the user search
   * through routes from unrelated domains.
   */
  const availableRoutes = useMemo(() => {
    const routes = filterOptions?.routes ?? [];

    if (filters.domains.length === 0) {
      return routes;
    }

    const selectedDomains = new Set(filters.domains);

    return routes.filter((route) => selectedDomains.has(route.domainName));
  }, [filterOptions, filters.domains]);

  const routeOptions = useMemo(
    () =>
      availableRoutes.map((route) => ({
        value: route.id,
        label: route.name,
        description: route.domainName,
        searchText: `${route.id} ${route.name} ${route.domainName}`,
      })),
    [availableRoutes],
  );

  const [relativeTimeNow, setRelativeTimeNow] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTimeNow(Date.now());
    }, 30_000);

    return () => clearInterval(timer);
  });

  const handleDomainsChange = (domains: string[]) => {
    /*
     * Domain and route filters have AND semantics.
     *
     * Therefore, if Domain A is removed, a route from Domain A should
     * not silently remain selected and create an impossible filter.
     */
    const selectedDomains = new Set(domains);

    const allowedRouteIds = new Set(
      (filterOptions?.routes ?? [])
        .filter(
          (route) =>
            domains.length === 0 || selectedDomains.has(route.domainName),
        )
        .map((route) => route.id),
    );

    onFiltersChange({
      domains,
      routeIds: filters.routeIds.filter((routeId) =>
        allowedRouteIds.has(routeId),
      ),
    });
  };

  const handleRoutesChange = (routeIds: string[]) => {
    onFiltersChange({
      ...filters,
      routeIds,
    });
  };

  const hasFilters = filters.domains.length > 0 || filters.routeIds.length > 0;

  const handleResetFilters = () => {
    onFiltersChange({ domains: [], routeIds: [] });
  };

  return (
    <Flex
      gap={4}
      mb={4}
      align={{
        base: "stretch",
        xl: "center",
      }}
      justify="space-between"
      direction={{
        base: "column",
        xl: "row",
      }}
    >
      <Heading size="xl">Dashboard</Heading>

      <Flex
        gap={2}
        align={{
          base: "stretch",
          md: "center",
        }}
        flexWrap="wrap"
        justify={{
          base: "flex-start",
          xl: "flex-end",
        }}
      >
        <NativeSelect.Root width="190px" size="sm">
          <NativeSelect.Field
            value={rangeKey}
            onChange={(event) =>
              onRangeChange(event.target.value as DashboardRangeKey)
            }
          >
            {Object.entries(DASHBOARD_RANGES).map(([key, range]) => (
              <option key={key} value={key}>
                {range.label}
              </option>
            ))}
          </NativeSelect.Field>

          <NativeSelect.Indicator />
        </NativeSelect.Root>

        <MultiSelectFilter
          title="Домены"
          options={domainOptions}
          selected={filters.domains}
          onChange={handleDomainsChange}
          disabled={!filterOptions}
          minWidth="180px"
        />

        <MultiSelectFilter
          title="СОПС"
          options={routeOptions}
          selected={filters.routeIds}
          onChange={handleRoutesChange}
          disabled={!filterOptions}
          minWidth="240px"
        />

        <ResetFilterButton
          disabled={!hasFilters}
          onClick={handleResetFilters}
        />

        <RefreshButton
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          ariaLabel="Обновить Dashboard"
        />

        <HStack gap={2}>
          <Switch.Root
            checked={isLiveEnabled}
            colorPalette="green"
            onCheckedChange={({ checked }) => onLiveEnabledChange(checked)}
          >
            <Switch.HiddenInput />
            <Switch.Control />
            <Switch.Label>Live</Switch.Label>
          </Switch.Root>

          <Box
            width="8px"
            height="8px"
            borderRadius="full"
            bg={
              liveStatus === "connected"
                ? "green.solid"
                : liveStatus === "connecting"
                  ? "orange.solid"
                  : liveStatus === "disconnected"
                    ? "red.solid"
                    : "fg.subtle"
            }
          />

          <Text fontSize="sm" color="fg.muted">
            {liveStatus === "connected"
              ? "Подключено"
              : liveStatus === "connecting"
                ? "Подключение"
                : liveStatus === "disconnected"
                  ? "Нет соединения"
                  : "Пауза"}
          </Text>
        </HStack>

        <Text fontSize="xs" color="fg.muted">
          Обновлено{" "}
          {lastUpdatedAt
            ? formatRelativeTime(
                lastUpdatedAt,
                relativeTimeNow || Date.parse(lastUpdatedAt),
              )
            : "-"}
        </Text>
      </Flex>
    </Flex>
  );
};

export default DashboardToolbar;
