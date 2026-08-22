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
import DashboardChartCard from "./DashboardChartCard";
import { getChartDateFormat } from "../chartDateFormat";

interface Props {
  data: MessageBucket[];
  rangeKey: DashboardRangeKey;
}

const MessageTrafficChart = ({ data, rangeKey }: Props) => {
  const hasData = data.some((bucket) => bucket.total > 0);

  const chart = useChart({
    data,
    series: [
      {
        name: "total",
        color: "blue.solid",
      },
    ],
  });

  const formatDate = chart.formatDate(getChartDateFormat(rangeKey));

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
            labelFormatter={(value) => formatDate(String(value))}
            content={<Chart.Tooltip />}
          />

          <defs>
            <Chart.Gradient
              id="message-traffic-gradient"
              stops={[
                {
                  offset: "0%",
                  color: "blue.solid",
                  opacity: 0.35,
                },
                {
                  offset: "100%",
                  color: "blue.solid",
                  opacity: 0.02,
                },
              ]}
            />
          </defs>

          <Area
            type="monotone"
            dataKey={chart.key("total")}
            stroke={chart.color("blue.solid")}
            fill="url(#message-traffic-gradient)"
            fillOpacity={1}
            isAnimationActive={false}
          />
        </AreaChart>
      </Chart.Root>
    </DashboardChartCard>
  );
};

export default MessageTrafficChart;
