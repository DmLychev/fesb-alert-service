import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Message } from "../types";
import StatusCell from "../../../components/StatusCell";
import formatDateTime from "../utils/formatDateTime";

const columnHelper = createColumnHelper<Message>();

export const messageColumns: ColumnDef<Message, any>[] = [
  columnHelper.accessor("route.domainName", {
    id: "route.domainName",
    header: "Домен",
  }),

  columnHelper.accessor("route.name", {
    id: "route.name",
    header: "СОПС",
  }),

  columnHelper.accessor("status", {
    id: "status",
    header: "Статус",
    cell: ({ getValue }) => <StatusCell value={getValue()} />,
  }),

  columnHelper.accessor("startDate", {
    id: "startDate",
    header: "Начало обработки",
    cell: ({ getValue }) => formatDateTime(getValue()),
  }),

  columnHelper.accessor("errorMessage", {
    id: "errorMessage",
    header: "Текст ошибки",
  }),

  columnHelper.accessor("updateStatusAttempts", {
    id: "updateStatusAttempts",
    header: "Попыток",
  }),

  columnHelper.accessor("exchangeId", {
    id: "exchangeId",
    header: "Exchange ID",
  }),

  columnHelper.accessor("requestId", {
    id: "requestId",
    header: "Request ID",
  }),
];

export default messageColumns;
