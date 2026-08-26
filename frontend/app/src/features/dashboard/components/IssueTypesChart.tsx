import { Chart, useChart } from "@chakra-ui/charts";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { IssueTypeStat } from "../types";

import DashboardChartCard from "./DashboardChartCard";

interface Props {
  data: IssueTypeStat[];
}

const MAX_LABEL_LENGTH = 32;

const IssueTypesChart = ({ data }: Props) => {
  const hasData = data.some((item) => item.count > 0);

  const chartData = data.slice(0, 8).map((item) => {
    const fullLabel = `${item.code} ${item.description}`;
    const shortLabel =
      fullLabel.length > MAX_LABEL_LENGTH
        ? `${fullLabel.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}...`
        : fullLabel;

    return { ...item, label: shortLabel, fullLabel };
  });

  const chart = useChart({
    data: chartData,
    series: [
      {
        name: "unsolvedCount",
        label: "Нерешённые",
        color: "orange.solid",
      },
      {
        name: "solvedCount",
        label: "Решённые",
        color: "green.solid",
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
            width={190}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip cursor={false} content={<Chart.Tooltip />} />

          <Legend content={<Chart.Legend />} />

          <Bar
            dataKey={chart.key("unsolvedCount")}
            stackId="issues"
            fill={chart.color("red.solid")}
            isAnimationActive={false}
          />

          <Bar
            dataKey={chart.key("solvedCount")}
            stackId="issues"
            fill={chart.color("green.solid")}
            isAnimationActive={false}
          />
        </BarChart>
      </Chart.Root>
    </DashboardChartCard>
  );
};

export default IssueTypesChart;
