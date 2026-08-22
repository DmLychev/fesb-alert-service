import { Chart, useChart } from "@chakra-ui/charts";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { IssueBucket } from "../types";

import DashboardChartCard from "./DashboardChartCard";

interface Props {
  data: IssueBucket[];
}

const IssuesTimelineChart = ({ data }: Props) => {
  const chart = useChart({
    data,
    series: [
      {
        name: "total",
        color: "orange.solid",
      },
    ],
  });

  return (
    <DashboardChartCard title="Инциденты во времени">
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
            tickFormatter={chart.formatDate({
              hour: "2-digit",
              minute: "2-digit",
            })}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            width={35}
          />

          <Tooltip cursor={false} content={<Chart.Tooltip />} />

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
