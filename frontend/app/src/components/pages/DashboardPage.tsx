import {
  Box,
  Flex,
  Heading,
  HStack,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Text,
  Switch,
} from "@chakra-ui/react";

import DashboardKpiCard from "../../features/dashboard/components/DashboardKpiCard";
import FesbApiHealthChart from "../../features/dashboard/components/FesbApiHealthChart";
import IssuesTimelineChart from "../../features/dashboard/components/IssuesTimelineChart";
import IssueTypesChart from "../../features/dashboard/components/IssueTypesChart";
import MessageTrafficChart from "../../features/dashboard/components/MessageTrafficChart";
import ProblematicRoutesChart from "../../features/dashboard/components/ProblematicRoutesChart";

import { DASHBOARD_RANGES } from "../../features/dashboard/dashboardRanges";

import useDashboard from "../../features/dashboard/hooks/useDashboard";

import { getDashboardMetrics } from "../../features/dashboard/selectors";

import type { DashboardRangeKey } from "../../features/dashboard/types";

const lastUpdatedFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const DashboardPage = () => {
  const {
    dashboard,
    rangeKey,
    setRangeKey,
    liveStatus,
    loading,
    error,
    lastUpdatedAt,
    isLiveEnabled,
    setIsLiveEnabled,
  } = useDashboard();

  if (!dashboard && loading) {
    return (
      <Flex height="full" align="center" justify="center">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!dashboard) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="md">
        <Text color="red.fg">{error ?? "Не удалось загрузить Dashboard"}</Text>
      </Box>
    );
  }

  const metrics = getDashboardMetrics(dashboard);

  const formatPercentage = (value: number | null) =>
    value === null ? "—" : `${value.toFixed(1)}% успешно`;

  return (
    <Box height="full" overflow="auto" pb={4}>
      <Flex
        gap={4}
        mb={4}
        align={{
          base: "stretch",
          md: "center",
        }}
        justify="space-between"
        direction={{
          base: "column",
          md: "row",
        }}
      >
        <Heading size="xl">Dashboard</Heading>

        <HStack gap={3}>
          <Text fontSize="xs" color="fg.muted">
            Обновлено:{" "}
            {lastUpdatedAt
              ? lastUpdatedFormatter.format(new Date(lastUpdatedAt))
              : "—"}
          </Text>

          <HStack gap={3}>
            <Switch.Root
              checked={isLiveEnabled}
              colorPalette="green"
              onCheckedChange={({ checked }) => setIsLiveEnabled(checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Live</Switch.Label>
            </Switch.Root>

            <HStack gap={2}>
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
          </HStack>

          <NativeSelect.Root width="210px" size="sm">
            <NativeSelect.Field
              value={rangeKey}
              onChange={(event) =>
                setRangeKey(event.target.value as DashboardRangeKey)
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
        </HStack>
      </Flex>

      {error && (
        <Box mb={4} px={3} py={2} borderWidth="1px" borderRadius="md">
          <Text fontSize="sm" color="orange.fg">
            {error}
          </Text>
        </Box>
      )}

      <SimpleGrid
        columns={{
          base: 1,
          sm: 2,
          xl: 4,
        }}
        gap={4}
        mb={4}
      >
        <DashboardKpiCard
          title="Сообщения"
          value={metrics.messages.toLocaleString()}
          secondary={formatPercentage(metrics.messageSuccessRate)}
        />

        <DashboardKpiCard
          title="Новые инциденты"
          value={metrics.newIssues.toLocaleString()}
        />

        <DashboardKpiCard
          title="Активные инциденты"
          value={metrics.activeIssues.toLocaleString()}
        />

        <DashboardKpiCard
          title="Ошибки API FESB"
          value={metrics.fesbFailures.toLocaleString()}
          secondary={formatPercentage(metrics.fesbSuccessRate)}
        />
      </SimpleGrid>

      <Box mb={4}>
        <MessageTrafficChart
          data={dashboard.messageTraffic}
          rangeKey={rangeKey}
        />
      </Box>

      <SimpleGrid
        columns={{
          base: 1,
          xl: 2,
        }}
        gap={4}
        mb={4}
      >
        <IssuesTimelineChart
          data={dashboard.issuesTimeline}
          rangeKey={rangeKey}
        />

        <IssueTypesChart data={dashboard.issueTypes} />

        <ProblematicRoutesChart data={dashboard.problematicRoutes} />

        <FesbApiHealthChart
          data={dashboard.fesbApiHealth}
          rangeKey={rangeKey}
        />
      </SimpleGrid>
    </Box>
  );
};

export default DashboardPage;
