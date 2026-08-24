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

import type { DashboardRangeKey, FesbRequestBucket } from "../types";
import DashboardChartCard from "./DashboardChartCard";
import {
  getChartAxisDateFormat,
  getChartTooltipDateFormat,
} from "../chartDateFormat";

interface Props {
  data: FesbRequestBucket[];
  rangeKey: DashboardRangeKey;
}

const FesbApiHealthChart = ({ data, rangeKey }: Props) => {
  const hasData = data.some(
    (bucket) => bucket.successful > 0 || bucket.failed > 0,
  );

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

  const formatAxisDate = chart.formatDate(getChartAxisDateFormat(rangeKey));
  const formatTooltipDate = chart.formatDate(
    getChartTooltipDateFormat(rangeKey),
  );

  return (
    <DashboardChartCard title="Доступность API FESB" isEmpty={!hasData}>
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
            tickFormatter={formatAxisDate}
          />

          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />

          <Tooltip
            cursor={false}
            animationDuration={100}
            labelFormatter={(value) => formatTooltipDate(String(value))}
            content={<Chart.Tooltip />}
          />

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
