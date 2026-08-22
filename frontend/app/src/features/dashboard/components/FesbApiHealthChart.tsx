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

import type { FesbRequestBucket } from "../types";

import DashboardChartCard from "./DashboardChartCard";

interface Props {
  data: FesbRequestBucket[];
}

const FesbApiHealthChart = ({ data }: Props) => {
  const chart = useChart({
    data,
    series: [
      {
        name: "successful",
        label: "Успешные",
        color: "green.solid",
      },
      {
        name: "failed",
        label: "Ошибки",
        color: "red.solid",
      },
    ],
  });

  return (
    <DashboardChartCard title="Доступность API FESB">
      <Chart.Root chart={chart} height="260px">
        <BarChart data={chart.data} responsive>
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

          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />

          <Tooltip cursor={false} content={<Chart.Tooltip />} />

          <Legend content={<Chart.Legend />} />

          <Bar
            dataKey={chart.key("successful")}
            stackId="requests"
            fill={chart.color("green.solid")}
            isAnimationActive={false}
          />

          <Bar
            dataKey={chart.key("failed")}
            stackId="requests"
            fill={chart.color("red.solid")}
            isAnimationActive={false}
          />
        </BarChart>
      </Chart.Root>
    </DashboardChartCard>
  );
};

export default FesbApiHealthChart;
