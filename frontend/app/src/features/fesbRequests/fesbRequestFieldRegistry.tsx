import type { TableFieldRegistry } from "../../components/DataTable";

import { formatDateTime } from "../../components/DataTable/utils/date";

import BooleanCell from "../../components/tableCells/BooleanCell";
import ScrollableTextCell from "../../components/tableCells/ScrollableTextCell";

import type { FesbRequest } from "./types";

export const FESB_REQUEST_FIELD_REGISTRY = {
  "type.title": {
    label: "Тип запроса",
    defaultSize: 220,

    column: {
      accessorFn: (request) => request.type.title,

      enableSorting: true,
    },

    value: {
      type: "string",
    },

    filter: true,
  },

  isSuccessful: {
    label: "Успешно",
    defaultSize: 100,

    column: {
      accessorFn: (request) => request.isSuccessful,

      enableSorting: true,

      cell: ({ getValue }) => <BooleanCell value={getValue()} />,
    },

    value: {
      type: "boolean",
    },

    filter: true,
  },

  details: {
    label: "Детали",
    defaultSize: 400,

    column: {
      accessorFn: (request) => request.details,

      enableSorting: true,

      cell: ({ getValue }) => <ScrollableTextCell getValue={getValue} />,
    },

    value: {
      type: "string",
      nullable: true,
    },

    filter: true,
  },

  warningLevel: {
    label: "Warning Level",
    defaultSize: 170,

    column: {
      accessorFn: (request) => request.warningLevel,

      enableSorting: true,
    },

    value: {
      type: "number",
      nullable: true,
    },

    filter: true,
  },

  createdAt: {
    label: "Дата создания",
    defaultSize: 180,

    column: {
      accessorFn: (request) => request.createdAt,

      enableSorting: true,

      cell: ({ getValue }) => formatDateTime(getValue()),
    },

    value: {
      type: "datetime",
    },

    filter: true,
  },

  updatedAt: {
    label: "Дата изменения",
    defaultSize: 180,

    column: {
      accessorFn: (request) => request.updatedAt,

      enableSorting: true,

      cell: ({ getValue }) => formatDateTime(getValue()),
    },

    value: {
      type: "datetime",
    },

    filter: true,
  },
} satisfies TableFieldRegistry<FesbRequest>;
