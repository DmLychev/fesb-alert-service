import { Chart, useChart } from "@chakra-ui/charts";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import type { RouteStat } from "../types";

import DashboardChartCard from "./DashboardChartCard";

interface Props {
  data: RouteStat[];
}

const ProblematicRoutesChart = ({ data }: Props) => {
  const chart = useChart({
    data: data.slice(0, 8),
    series: [
      {
        name: "count",
        color: "red.solid",
      },
    ],
  });

  return (
    <DashboardChartCard title="Проблемные СОПС">
      <Chart.Root chart={chart} height="260px">
        <BarChart data={chart.data} layout="vertical" responsive>
          <CartesianGrid
            horizontal={false}
            stroke={chart.color("border.muted")}
          />

          <XAxis
            type="number"
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            type="category"
            width={170}
            axisLine={false}
            tickLine={false}
            dataKey={chart.key("routeName")}
          />

          <Tooltip cursor={false} content={<Chart.Tooltip />} />

          <Bar
            dataKey={chart.key("count")}
            fill={chart.color("red.solid")}
            radius={4}
            isAnimationActive={false}
          />
        </BarChart>
      </Chart.Root>
    </DashboardChartCard>
  );
};

export default ProblematicRoutesChart;
