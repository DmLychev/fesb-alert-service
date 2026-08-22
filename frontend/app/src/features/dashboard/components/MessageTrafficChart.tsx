import { Box, HStack, Text, VStack } from "@chakra-ui/react";

import { Chart, useChart } from "@chakra-ui/charts";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardRangeKey, MessageBucket } from "../types";

import { getChartDateFormat } from "../chartDateFormat";

import DashboardChartCard from "./DashboardChartCard";

interface Props {
  data: MessageBucket[];
  rangeKey: DashboardRangeKey;
}

interface MessageChartRow extends MessageBucket {
  withoutFinalStatus: number;
}

const MessageTrafficChart = ({ data, rangeKey }: Props) => {
  const chartData: MessageChartRow[] = data.map((bucket) => ({
    ...bucket,

    withoutFinalStatus: Math.max(
      0,
      bucket.total - bucket.successful - bucket.failed,
    ),
  }));

  const hasData = chartData.some((bucket) => bucket.total > 0);

  const chart = useChart({
    data: chartData,

    series: [
      {
        name: "successful",
        label: "Успешные",
        color: "green.solid",
      },
      {
        name: "withoutFinalStatus",
        label: "Без финального статуса",
        color: "orange.solid",
      },
      {
        name: "failed",
        label: "Ошибки",
        color: "red.solid",
      },
    ],
  });

  const formatDate = chart.formatDate(getChartDateFormat(rangeKey));

  const formatNumber = chart.formatNumber({
    maximumFractionDigits: 0,
  });

  const CustomTooltip = ({ active, payload, label }: TooltipContentProps) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const row = payload[0]?.payload as MessageChartRow | undefined;

    if (!row) {
      return null;
    }

    return (
      <Box
        bg="bg.panel"
        borderWidth="1px"
        borderRadius="md"
        boxShadow="md"
        px={3}
        py={2}
        minWidth="220px"
      >
        <Text fontSize="sm" fontWeight="semibold" mb={2}>
          {label != null ? formatDate(String(label)) : ""}
        </Text>

        <VStack align="stretch" gap={1}>
          <HStack justify="space-between">
            <Text fontSize="sm">Всего</Text>

            <Text fontSize="sm" fontWeight="semibold">
              {formatNumber(row.total)}
            </Text>
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="sm" color="green.fg">
              Успешные
            </Text>

            <Text fontSize="sm">{formatNumber(row.successful)}</Text>
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="sm" color="orange.fg">
              Без финального статуса
            </Text>

            <Text fontSize="sm">{formatNumber(row.withoutFinalStatus)}</Text>
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="sm" color="red.fg">
              Ошибки
            </Text>

            <Text fontSize="sm">{formatNumber(row.failed)}</Text>
          </HStack>
        </VStack>
      </Box>
    );
  };

  return (
    <DashboardChartCard
      title="Трафик сообщений"
      isEmpty={!hasData}
      height="320px"
    >
      <Chart.Root chart={chart} height="320px">
        <AreaChart
          data={chart.data}
          responsive
          margin={{
            top: 10,
            right: 10,
            bottom: 0,
            left: 0,
          }}
        >
          <CartesianGrid
            vertical={false}
            stroke={chart.color("border.muted")}
          />

          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey={chart.key("start")}
            tickFormatter={formatDate}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={chart.formatNumber({
              notation: "compact",
            })}
          />

          <Tooltip
            cursor={false}
            animationDuration={100}
            content={(props) => <CustomTooltip {...props} />}
          />

          <Area
            type="monotone"
            dataKey={chart.key("successful")}
            stackId="messages"
            stroke={chart.color("green.solid")}
            fill={chart.color("green.subtle")}
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey={chart.key("withoutFinalStatus")}
            stackId="messages"
            stroke={chart.color("orange.solid")}
            fill={chart.color("orange.subtle")}
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey={chart.key("failed")}
            stackId="messages"
            stroke={chart.color("red.solid")}
            fill={chart.color("red.subtle")}
            isAnimationActive={false}
          />
        </AreaChart>
      </Chart.Root>
    </DashboardChartCard>
  );
};

export default MessageTrafficChart;
