import { Chart, useChart } from "@chakra-ui/charts";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardRangeKey, MessageBucket } from "../types";

import {
  getChartAxisDateFormatter,
  getChartTooltipDateFormatter,
} from "../chartDateFormat";

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
        label: "Без статуса",
        color: "orange.solid",
      },
      {
        name: "failed",
        label: "Ошибки",
        color: "red.solid",
      },
    ],
  });

  const formatAxisDate = getChartAxisDateFormatter(rangeKey);
  const formatTooltipDate = getChartTooltipDateFormatter(rangeKey);

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
            tickFormatter={formatAxisDate}
            minTickGap={24}
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
            labelFormatter={(value) => formatTooltipDate(String(value))}
            content={<Chart.Tooltip />}
          />

          <Area
            type="monotone"
            dataKey={chart.key("failed")}
            stackId="messages"
            stroke={chart.color("red.solid")}
            fill={chart.color("red.subtle")}
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
            dataKey={chart.key("successful")}
            stackId="messages"
            stroke={chart.color("green.solid")}
            fill={chart.color("green.subtle")}
            isAnimationActive={false}
          />
        </AreaChart>
      </Chart.Root>
    </DashboardChartCard>
  );
};

export default MessageTrafficChart;
