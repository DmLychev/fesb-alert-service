import type { DashboardRangeKey } from "./types";

interface ChartTimePoint {
  start: string;
}

const createDateFormatter = (
  options: Intl.DateTimeFormatOptions,
) => {
  const formatter = new Intl.DateTimeFormat(
    "ru-RU",
    options,
  );

  return (value: string | number): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return formatter.format(date);
  };
};


export const getChartAxisDateFormatter = (
  rangeKey: DashboardRangeKey,
) => {
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


export const getChartTooltipDateFormatter = (
  rangeKey: DashboardRangeKey,
) => {
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
const dayKeyFormatter = new Intl.DateTimeFormat(
  "ru-RU",
  {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  },
);


const sampleEvenly = <T,>(
  values: T[],
  maximum: number,
): T[] => {
  if (values.length <= maximum) {
    return values;
  }

  const lastIndex = values.length - 1;

  return Array.from(
    { length: maximum },
    (_, index) => {
      const sourceIndex = Math.round(
        (index * lastIndex) /
          (maximum - 1),
      );

      return values[sourceIndex];
    },
  );
};


const getDayKey = (date: Date): string =>
  [
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ].join("-");


const getDailyTicks = (
  data: ChartTimePoint[],
): string[] => {
  const result: string[] = [];

  let previousDay: string | null = null;

  for (const point of data) {
    const date = new Date(point.start);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const day = getDayKey(date);

    if (day === previousDay) {
      continue;
    }

    previousDay = day;
    result.push(point.start);
  }

  return result;
};


export const getChartAxisTicks = (
  data: ChartTimePoint[],
  rangeKey: DashboardRangeKey,
): string[] => {
  switch (rangeKey) {
    /*
     * 1-minute buckets.
     *
     * Show:
     * 16:25  16:30  16:35  16:40 ...
     */
    case "hour":
      return data
        .filter((point) => {
          const date = new Date(point.start);

          return (
            !Number.isNaN(date.getTime()) &&
            date.getMinutes() % 5 === 0
          );
        })
        .map((point) => point.start);


    /*
     * 5-minute buckets.
     *
     * Show:
     * 10:00  10:30  11:00  11:30 ...
     */
    case "sixHours":
      return data
        .filter((point) => {
          const date = new Date(point.start);

          return (
            !Number.isNaN(date.getTime()) &&
            date.getMinutes() % 30 === 0
          );
        })
        .map((point) => point.start);


    /*
     * 15-minute buckets.
     *
     * Show:
     * 00:00  02:00  04:00  06:00 ...
     */
    case "day":
      return data
        .filter((point) => {
          const date = new Date(point.start);

          return (
            !Number.isNaN(date.getTime()) &&
            date.getMinutes() === 0 &&
            date.getHours() % 2 === 0
          );
        })
        .map((point) => point.start);


    /*
     * One representative timestamp for every local calendar day.
     */
    case "week":
    case "month":
      return getDailyTicks(data);
  }
};
