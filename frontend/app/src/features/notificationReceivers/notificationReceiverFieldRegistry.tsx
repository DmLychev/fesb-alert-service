import type { TableFieldRegistry } from "../../components/DataTable";
import { formatDateTime } from "../../components/DataTable/utils/date";
import ScrollableTextCell from "../../components/tableCells/ScrollableTextCell";
import type { NotificationReceiver } from "./types";

export const NOTIFICATION_RECEIVER_FIELD_REGISTRY = {
  scope: {
    label: "Область",
    defaultSize: 110,

    column: {
      accessorFn: (receiver) => {
        if (receiver.route) return "Маршрут";
        if (receiver.domainName) return "Домен";

        return "Глобально";
      },
      enableSorting: false,
    },
  },

  email: {
    label: "Email",
    defaultSize: 220,

    column: {
      accessorFn: (receiver) => receiver.email,
      enableSorting: true,
    },

    value: {
      type: "string",
    },

    filter: true,
  },

  "issueType.code": {
    label: "Код ошибки",
    defaultSize: 100,

    column: {
      accessorFn: (receiver) =>
        receiver.issueType?.code ?? null,

      enableSorting: true,

      cell: ({ getValue }) =>
        getValue() ?? "Все",
    },

    value: {
      type: "number",
      nullable: true,
    },

    filter: true,
  },

  "issueType.description": {
    label: "Тип ошибки",
    defaultSize: 260,

    column: {
      accessorFn: (receiver) =>
        receiver.issueType?.description ?? null,

      enableSorting: true,

      cell: ({ getValue }) => (
        <ScrollableTextCell getValue={getValue} />
      ),
    },

    value: {
      type: "string",
      nullable: true,
    },

    filter: true,
  },

  domainName: {
    label: "Домен",
    defaultSize: 150,

    column: {
      accessorFn: (receiver) =>
        receiver.domainName,

      enableSorting: true,
    },

    value: {
      type: "string",
      nullable: true,
    },

    filter: true,
  },

  "route.id": {
    label: "Route ID",
    defaultSize: 220,

    column: {
      accessorFn: (receiver) =>
        receiver.route?.id ?? null,

      enableSorting: true,
    },

    value: {
      type: "string",
      nullable: true,
    },

    filter: true,
  },

  "route.name": {
    label: "СОПС",
    defaultSize: 220,

    column: {
      accessorFn: (receiver) =>
        receiver.route?.name ?? null,

      enableSorting: true,
    },

    value: {
      type: "string",
      nullable: true,
    },

    filter: true,
  },

  createdAt: {
    label: "Дата создания",
    defaultSize: 180,

    column: {
      accessorFn: (receiver) =>
        receiver.createdAt,

      enableSorting: true,

      cell: ({ getValue }) =>
        formatDateTime(getValue()),
    },

    value: {
      type: "datetime",
    },

    filter: true,
  },
} satisfies TableFieldRegistry<NotificationReceiver>;
