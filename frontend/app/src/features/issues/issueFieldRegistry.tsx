import type { TableFieldRegistry } from "../../components/DataTable";
import { formatDateTime } from "../../components/DataTable/utils/date";
import BooleanCell from "../../components/tableCells/BooleanCell";
import ScrollableTextCell from "../../components/tableCells/ScrollableTextCell";
import type { Issue } from "./types";

export const ISSUE_FIELD_REGISTRY = {
  "type.code": {
    label: "Код",
    defaultSize: 50,
    column: {
      accessorFn: (issue) => issue.type.code,
      enableSorting: true,
    },
    value: { type: "number" },
    filter: true,
  },

  "type.description": {
    label: "Описание ошибки",
    defaultSize: 200,
    column: {
      accessorFn: (issue) => issue.type.description,
      enableSorting: true,
      cell: ({ getValue }) => <ScrollableTextCell getValue={getValue} />,
    },
    value: { type: "string" },
  },

  text: {
    label: "Текст ошибки",
    defaultSize: 350,
    column: {
      accessorFn: (issue) => issue.text,
      enableSorting: true,
      cell: ({ getValue }) => <ScrollableTextCell getValue={getValue} />,
    },
    value: { type: "string", nullable: true },
    filter: true,
  },

  routeId: {
    label: "Route ID",
    defaultSize: 350,
    column: {
      accessorFn: (issue) => issue.routeId,
      enableSorting: true,
    },
    value: { type: "string", nullable: true },
    filter: true,
  },

  domainName: {
    label: "Домен",
    defaultSize: 80,
    column: {
      accessorFn: (issue) => issue.domainName,
      enableSorting: true,
    },
    value: { type: "string", nullable: true },
    filter: true,
  },

  isNotified: {
    label: "Уведомление",
    defaultSize: 125,
    column: {
      accessorFn: (issue) => issue.isNotified,
      enableSorting: true,
      cell: ({ getValue }) => <BooleanCell value={getValue()} />,
    },
    value: { type: "boolean", nullable: true },
    filter: true,
    edit: true,
  },

  isSolved: {
    label: "Решено",
    defaultSize: 125,
    column: {
      accessorFn: (issue) => issue.isSolved,
      enableSorting: true,
      cell: ({ getValue }) => <BooleanCell value={getValue()} />,
    },
    value: { type: "boolean" },
    filter: true,
    edit: true,
  },

  createdAt: {
    label: "Дата создания",
    defaultSize: 180,
    column: {
      accessorFn: (issue) => issue.createdAt,
      enableSorting: true,
      cell: ({ getValue }) => formatDateTime(getValue()),
    },
    value: { type: "datetime" },
    filter: true,
  },

  updatedAt: {
    label: "Дата изменения",
    defaultSize: 180,
    column: {
      accessorFn: (issue) => issue.updatedAt,
      enableSorting: true,
      cell: ({ getValue }) => formatDateTime(getValue()),
    },
    value: { type: "datetime" },
    filter: true,
  },
} satisfies TableFieldRegistry<Issue>;
