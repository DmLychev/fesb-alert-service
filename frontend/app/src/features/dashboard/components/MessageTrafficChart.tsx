import { Chart, useChart } from "@chakra-ui/charts";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MessageBucket } from "../types";

import DashboardChartCard from "./DashboardChartCard";

interface Props {
  data: MessageBucket[];
}

const MessageTrafficChart = ({ data }: Props) => {
  const chart = useChart({
    data,
    series: [
      {
        name: "total",
        color: "blue.solid",
      },
    ],
  });

  return (
    <DashboardChartCard title="Трафик сообщений">
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
            tickFormatter={chart.formatDate({
              hour: "2-digit",
              minute: "2-digit",
            })}
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
