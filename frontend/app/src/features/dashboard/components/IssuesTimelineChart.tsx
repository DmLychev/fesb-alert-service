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
import { getChartDateFormat } from "../chartDateFormat";

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

  const formatDate = chart.formatDate(getChartDateFormat(rangeKey));

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
            tickFormatter={formatDate}
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
            labelFormatter={(value) => formatDate(String(value))}
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
