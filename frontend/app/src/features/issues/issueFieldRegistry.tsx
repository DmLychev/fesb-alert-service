import type { TableFieldRegistry } from "../../components/DataTable";
import { formatDateTime } from "../../components/DataTable/utils/date";
import type { Issue } from "./types";
import ScrollableTextCell from "./components/ScrollableTextCell";

export const ISSUE_FIELD_REGISTRY = {
  "type.code": {
    label: "Код",
    column: {
      accessorFn: (issue) => issue.type.code,
      enableSorting: true,
    },
    value: { type: "number" },
    filter: true,
  },

  "type.description": {
    label: "Описание ошибки",
    column: {
      accessorFn: (issue) => issue.type.description,
      enableSorting: true,
      cell: ({ getValue }) => <ScrollableTextCell getValue={getValue} />,
    },
    value: { type: "string" },
  },

  text: {
    label: "Текст ошибки",
    defaultSize: 200,
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
    column: {
      accessorFn: (issue) => issue.routeId,
      enableSorting: true,
    },
    value: { type: "string", nullable: true },
    filter: true,
  },

  domainName: {
    label: "Домен",
    column: {
      accessorFn: (issue) => issue.domainName,
      enableSorting: true,
    },
    value: {
      type: "string",
    },
    filter: true,
  },

  isNotified: {
    label: "Уведомление отправлено",
    column: {
      accessorFn: (issue) => issue.isNotified,
      enableSorting: true,
    },
    value: {
      type: "boolean",
    },
    filter: true,
    edit: true,
  },

  isSolved: {
    label: "Решено",
    column: {
      accessorFn: (issue) => issue.isSolved,
      enableSorting: true,
    },
    value: {
      type: "boolean",
    },
    filter: true,
    edit: true,
  },

  createdAt: {
    label: "Уведомление отправлено",
    column: {
      accessorFn: (issue) => issue.createdAt,
      enableSorting: true,
      cell: ({ getValue }) => formatDateTime(getValue()),
    },
    value: {
      type: "datetime",
    },
    filter: true,
  },

  updatedAt: {
    label: "Уведомление отправлено",
    column: {
      accessorFn: (issue) => issue.updatedAt,
      enableSorting: true,
      cell: ({ getValue }) => formatDateTime(getValue()),
    },
    value: {
      type: "datetime",
    },
    filter: true,
  },
} satisfies TableFieldRegistry<Issue>;
