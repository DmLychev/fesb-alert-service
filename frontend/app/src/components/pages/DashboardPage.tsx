import { Box, Flex, SimpleGrid, Spinner, Text } from "@chakra-ui/react";

import DashboardKpiCard from "../../features/dashboard/components/DashboardKpiCard";
import FesbApiHealthChart from "../../features/dashboard/components/FesbApiHealthChart";
import IssuesTimelineChart from "../../features/dashboard/components/IssuesTimelineChart";
import IssueTypesChart from "../../features/dashboard/components/IssueTypesChart";
import MessageTrafficChart from "../../features/dashboard/components/MessageTrafficChart";
import ProblematicRoutesChart from "../../features/dashboard/components/ProblematicRoutesChart";

import useDashboard from "../../features/dashboard/hooks/useDashboard";

import {
  getDashboardMetrics,
  getMetricComparison,
} from "../../features/dashboard/selectors";
import DashboardToolbar from "../../features/dashboard/components/DashboardToolbar";

const DashboardPage = () => {
  const {
    dashboard,

    rangeKey,
    setRangeKey,

    filters,
    setFilters,
    filterOptions,

    liveStatus,

    loading,
    isRefreshing,
    error,

    refresh,
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

  const messageComparison = getMetricComparison(
    metrics.messages,
    dashboard.previousPeriod.messages,
  );
  const newIssuesComparison = getMetricComparison(
    metrics.newIssues,
    dashboard.previousPeriod.newIssues,
  );
  const fesbFailuresComparison = getMetricComparison(
    metrics.fesbFailures,
    dashboard.previousPeriod.fesbFailures,
  );

  const formatPercentage = (value: number | null) =>
    value === null ? "—" : `${value.toFixed(1)}% успешно`;

  return (
    <Box height="full" overflow="auto" pb={4}>
      <DashboardToolbar
        rangeKey={rangeKey}
        onRangeChange={setRangeKey}
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        liveStatus={liveStatus}
        isLiveEnabled={isLiveEnabled}
        onLiveEnabledChange={setIsLiveEnabled}
        lastUpdatedAt={lastUpdatedAt}
      />

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
          valueColor={metrics.messageFailures === 0 ? "green.fg" : "red.fg"}
          secondary={formatPercentage(metrics.messageSuccessRate)}
          comparison={{ ...messageComparison, intent: "neutral" }}
        />

        <DashboardKpiCard
          title="Новые инциденты"
          value={metrics.newIssues.toLocaleString()}
          valueColor={metrics.newIssues === 0 ? "green.fg" : "red.fg"}
          comparison={{ ...newIssuesComparison, intent: "lower-is-better" }}
        />

        <DashboardKpiCard
          title="Активные инциденты"
          value={metrics.activeIssues.toLocaleString()}
          valueColor={metrics.activeIssues === 0 ? "green.fg" : "red.fg"}
        />

        <DashboardKpiCard
          title="Ошибки API FESB"
          value={metrics.fesbFailures.toLocaleString()}
          valueColor={metrics.fesbFailures === 0 ? "green.fg" : "red.fg"}
          secondary={formatPercentage(metrics.fesbSuccessRate)}
          comparison={{ ...fesbFailuresComparison, intent: "lower-is-better" }}
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
