import { Chart, useChart } from "@chakra-ui/charts";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import type { IssueTypeStat } from "../types";

import DashboardChartCard from "./DashboardChartCard";

interface Props {
  data: IssueTypeStat[];
}

const IssueTypesChart = ({ data }: Props) => {
  const hasData = data.some((item) => item.count > 0);

  const chartData = data.slice(0, 8).map((item) => ({
    ...item,
    label: `${item.code} ${item.description}`,
  }));

  const chart = useChart({
    data: chartData,
    series: [
      {
        name: "count",
        color: "orange.solid",
      },
    ],
  });

  return (
    <DashboardChartCard title="Инциденты по типам" isEmpty={!hasData}>
      <Chart.Root chart={chart} height="260px">
        <BarChart
          data={chart.data}
          layout="vertical"
          responsive
          margin={{
            left: 10,
            right: 15,
          }}
        >
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
            dataKey={chart.key("label")}
            width={170}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip cursor={false} content={<Chart.Tooltip />} />

          <Bar
            dataKey={chart.key("count")}
            fill={chart.color("orange.solid")}
            radius={4}
            isAnimationActive={false}
          />
        </BarChart>
      </Chart.Root>
    </DashboardChartCard>
  );
};

export default IssueTypesChart;
