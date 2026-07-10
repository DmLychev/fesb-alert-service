const formatDateTime = (rawValue: any) => {
  if (!rawValue) return "";
  const date = new Date(rawValue);
  const pad = (num: number, size = 2) => String(num).padStart(size, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
};

export default formatDateTime;
