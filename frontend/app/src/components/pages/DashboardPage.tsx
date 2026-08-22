import {
  Box,
  Flex,
  Heading,
  HStack,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Text,
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

const DashboardPage = () => {
  const { dashboard, rangeKey, setRangeKey, liveStatus, loading, error } =
    useDashboard();

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
                    : "red.solid"
              }
            />

            <Text fontSize="sm">
              {liveStatus === "connected"
                ? "Live"
                : liveStatus === "connecting"
                  ? "Connecting"
                  : "Disconnected"}
            </Text>
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
        <MessageTrafficChart data={dashboard.messageTraffic} />
      </Box>

      <SimpleGrid
        columns={{
          base: 1,
          xl: 2,
        }}
        gap={4}
        mb={4}
      >
        <IssuesTimelineChart data={dashboard.issuesTimeline} />

        <IssueTypesChart data={dashboard.issueTypes} />

        <ProblematicRoutesChart data={dashboard.problematicRoutes} />

        <FesbApiHealthChart data={dashboard.fesbApiHealth} />
      </SimpleGrid>
    </Box>
  );
};

export default DashboardPage;
