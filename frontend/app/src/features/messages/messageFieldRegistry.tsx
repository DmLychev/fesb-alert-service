import type { TableFieldRegistry } from "../../components/DataTable";
import { formatDateTime } from "../../components/DataTable/utils/date";
import StatusCell from "./components/StatusCell";
import type { Message } from "./types";
import ScrollableTextCell from "./components/ScrollableTextCell";

export const MESSAGE_FIELD_REGISTRY = {
  "route.domainName": {
    label: "Домен",

    column: {
      accessorFn: (message) => message.route.domainName,
      enableSorting: true,
    },

    filter: {
      type: "string",
    },
  },

  "route.name": {
    label: "СОПС",

    column: {
      accessorFn: (message) => message.route.name,
      enableSorting: true,
    },

    filter: {
      type: "string",
    },
  },

  status: {
    label: "Статус",
    defaultSize: 86,

    column: {
      accessorFn: (message) => message.status,
      enableSorting: true,

      cell: ({ getValue }) => <StatusCell value={getValue()} />,
    },

    filter: {
      type: "choice",
      nullable: true,
      choices: [
        { value: "SUCCESS", label: "SUCCESS" },
        { value: "ERROR", label: "ERROR" },
      ],
    },
  },

  startDate: {
    label: "Начало обработки",
    defaultSize: 176,

    column: {
      accessorFn: (message) => message.startDate,
      enableSorting: true,

      cell: ({ getValue }) => formatDateTime(getValue()),
    },

    filter: {
      type: "datetime",
    },
  },

  errorMessage: {
    label: "Текст ошибки",
    defaultSize: 200,

    column: {
      accessorFn: (message) => message.errorMessage,
      enableSorting: true,
      cell: ({ getValue }) => <ScrollableTextCell getValue={getValue} />,
    },

    filter: {
      type: "string",
      nullable: true,
    },
  },

  updateStatusAttempts: {
    label: "Попыток",

    column: {
      accessorFn: (message) => message.updateStatusAttempts,
      enableSorting: true,
    },

    filter: {
      type: "number",
    },
  },

  exchangeId: {
    label: "Exchange ID",

    column: {
      accessorFn: (message) => message.exchangeId,
      enableSorting: true,
    },

    filter: {
      type: "string",
    },
  },

  requestId: {
    label: "Request ID",

    column: {
      accessorFn: (message) => message.requestId,
      enableSorting: true,
    },

    filter: {
      type: "string",
    },
  },
} satisfies TableFieldRegistry<Message>;
