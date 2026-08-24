import type { DashboardRangeKey } from "./types";

interface ChartTimePoint {
  start: string;
}

const createDateFormatter = (options: Intl.DateTimeFormatOptions) => {
  const formatter = new Intl.DateTimeFormat("ru-RU", options);

  return (value: string | number): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return formatter.format(date);
  };
};

export const getChartAxisDateFormatter = (rangeKey: DashboardRangeKey) => {
  switch (rangeKey) {
    case "hour":
    case "sixHours":
    case "day":
      return createDateFormatter({
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });

    case "week":
    case "month":
      return createDateFormatter({
        day: "2-digit",
        month: "2-digit",
      });
  }
};

export const getChartTooltipDateFormatter = (rangeKey: DashboardRangeKey) => {
  switch (rangeKey) {
    case "hour":
      return createDateFormatter({
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });

    case "sixHours":
    case "day":
    case "week":
    case "month":
      return createDateFormatter({
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
  }
};

/*
 * Used only for determining whether two timestamps belong
 * to the same local calendar day.
 *
 * The year is included even though it isn't displayed on the axis.
 */
const dayKeyFormatter = new Intl.DateTimeFormat("ru-RU", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const sampleEvenly = <T>(values: T[], maximum: number): T[] => {
  if (values.length <= maximum) {
    return values;
  }

  const lastIndex = values.length - 1;

  return Array.from({ length: maximum }, (_, index) => {
    const sourceIndex = Math.round((index * lastIndex) / (maximum - 1));

    return values[sourceIndex];
  });
};

/*
 * For short periods Recharts may select ticks normally.
 *
 * For week/month we explicitly provide one candidate per calendar
 * day and then limit the total number of labels.
 *
 * This prevents:
 *
 * 20.08   20.08   21.08   21.08
 *
 * while the underlying hourly/6-hour data remains untouched.
 */
export const getChartAxisTicks = (
  data: ChartTimePoint[],
  rangeKey: DashboardRangeKey,
): string[] | undefined => {
  if (rangeKey !== "week" && rangeKey !== "month") {
    return undefined;
  }

  const dailyTicks: string[] = [];

  let previousDay: string | null = null;

  for (const point of data) {
    const date = new Date(point.start);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const day = dayKeyFormatter.format(date);

    if (day === previousDay) {
      continue;
    }

    previousDay = day;

    /*
     * Keep the timestamp as the tick value.
     * XAxis still uses "start" as its category.
     */
    dailyTicks.push(point.start);
  }

  return dailyTicks;
};
