import { Chart, useChart } from "@chakra-ui/charts";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardRangeKey, IssueBucket } from "../types";
import DashboardChartCard from "./DashboardChartCard";
import {
  getChartAxisDateFormat,
  getChartTooltipDateFormat,
} from "../chartDateFormat";

interface Props {
  data: IssueBucket[];
  rangeKey: DashboardRangeKey;
}

const IssuesTimelineChart = ({ data, rangeKey }: Props) => {
  const hasData = data.some((bucket) => bucket.total > 0);

  const chart = useChart({
    data,
    series: [
      {
        name: "total",
        color: "orange.solid",
      },
    ],
  });

  const formatAxisDate = chart.formatDate(getChartAxisDateFormat(rangeKey));
  const formatTooltipDate = chart.formatDate(
    getChartTooltipDateFormat(rangeKey),
  );

  return (
    <DashboardChartCard title="Инциденты во времени" isEmpty={!hasData}>
      <Chart.Root chart={chart} height="260px">
        <AreaChart data={chart.data} responsive>
          <CartesianGrid
            vertical={false}
            stroke={chart.color("border.muted")}
          />

          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey={chart.key("start")}
            tickFormatter={formatAxisDate}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            width={35}
          />

          <Tooltip
            cursor={false}
            animationDuration={100}
            labelFormatter={(value) => formatTooltipDate(String(value))}
            content={<Chart.Tooltip />}
          />

          <Area
            type="monotone"
            dataKey={chart.key("total")}
            fill={chart.color("orange.subtle")}
            stroke={chart.color("orange.solid")}
            isAnimationActive={false}
          />
        </AreaChart>
      </Chart.Root>
    </DashboardChartCard>
  );
};

export default IssuesTimelineChart;
