import StatusCell from "../components/StatusCell";
import type { ColumnMetadata } from "../types";

export const FIELD_REGISTRY: Record<string, ColumnMetadata> = {
  "route.domainName": { label: "Домен", type: "string" },
  "route.name": { label: "СОПС", type: "string" },
  status: {
    label: "Статус",
    type: "choice",
    nullable: true,
    choices: [
      { value: "SUCCESS", label: "SUCCESS" },
      { value: "ERROR", label: "ERROR" },
    ],
    renderCell: StatusCell,
  },
  startDate: {
    label: "Начало обработки",
    type: "datetime",
    renderCell: (rawValue) => {
      if (!rawValue) return "";
      const date = new Date(rawValue);
      const pad = (num: number, size = 2) => String(num).padStart(size, "0");
      return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
    },
  },
  errorMessage: { label: "Текст ошибки", type: "string" },
  updateStatusAttempts: { label: "Попыток", type: "number" },
  exchangeId: { label: "Exchange ID", type: "string" },
  requestId: { label: "Request ID", type: "string" },
};
