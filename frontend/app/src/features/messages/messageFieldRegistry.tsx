import type { TableFieldRegistry } from "../../components/DataTable";
import { formatDateTime } from "../../components/DataTable/utils/date";
import StatusCell from "./components/StatusCell";
import type { Message } from "./types";

export const MESSAGE_FIELD_REGISTRY = {
  "route.domainName": {
    label: "Домен",

    column: {
      accessorFn: (message) => message.route.domainName,
      enableSorting: true,
      size: 100,
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
      size: 100,
    },

    filter: {
      type: "string",
    },
  },

  status: {
    label: "Статус",

    column: {
      accessorFn: (message) => message.status,
      enableSorting: true,
      size: 100,

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

    column: {
      accessorFn: (message) => message.startDate,
      enableSorting: true,
      size: 100,

      cell: ({ getValue }) => formatDateTime(getValue()),
    },

    filter: {
      type: "datetime",
    },
  },

  errorMessage: {
    label: "Текст ошибки",

    column: {
      accessorFn: (message) => message.errorMessage,
      enableSorting: true,
      size: 100,
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
      size: 100,
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
      size: 100,
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
      size: 100,
    },

    filter: {
      type: "string",
    },
  },
} satisfies TableFieldRegistry<Message>;
