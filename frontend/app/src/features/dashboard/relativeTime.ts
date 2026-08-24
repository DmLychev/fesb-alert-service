const relativeTimeFormatter = new Intl.RelativeTimeFormat("ru-RU", {
  numeric: "always",
});

export const formatRelativeTime = (value: string, now: number): string => {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) return "-";

  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (elapsedSeconds < 10) return "сейчас";
  if (elapsedSeconds < 60) return "меньше минуты назад";

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 60)
    return relativeTimeFormatter.format(-elapsedMinutes, "minute");

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24)
    return relativeTimeFormatter.format(-elapsedHours, "hour");

  const elapsedDays = Math.floor(elapsedHours / 24);

  return relativeTimeFormatter.format(-elapsedDays, "day");
};
