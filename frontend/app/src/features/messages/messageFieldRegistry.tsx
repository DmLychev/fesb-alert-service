import type { TableFieldRegistry } from "../../components/DataTable";
import { formatDateTime } from "../../components/DataTable/utils/date";
import StatusCell from "./components/StatusCell";
import type { Message } from "./types";
import ScrollableTextCell from "./components/ScrollableTextCell";
import MessageStatusEditor from "./components/MessageStatusEditor";

export const MESSAGE_FIELD_REGISTRY = {
  "route.domainName": {
    label: "Домен",

    column: {
      accessorFn: (message) => message.route.domainName,
      enableSorting: true,
    },

    value: {
      type: "string",
    },

    filter: true,
  },

  "route.name": {
    label: "СОПС",

    column: {
      accessorFn: (message) => message.route.name,
      enableSorting: true,
    },

    value: {
      type: "string",
    },

    filter: true,
  },

  status: {
    label: "Статус",
    defaultSize: 86,

    column: {
      accessorFn: (message) => message.status,
      enableSorting: true,

      cell: ({ getValue }) => <StatusCell value={getValue()} />,
    },

    value: {
      type: "choice",
      nullable: true,
      choices: [
        { value: "SUCCESS", label: "SUCCESS" },
        { value: "ERROR", label: "ERROR" },
      ],
    },

    filter: true,
    edit: { renderEditor: (props) => <MessageStatusEditor {...props} /> },
  },

  startDate: {
    label: "Начало обработки",
    defaultSize: 176,

    column: {
      accessorFn: (message) => message.startDate,
      enableSorting: true,

      cell: ({ getValue }) => formatDateTime(getValue()),
    },

    value: {
      type: "datetime",
    },

    filter: true,
  },

  errorMessage: {
    label: "Текст ошибки",
    defaultSize: 200,

    column: {
      accessorFn: (message) => message.errorMessage,
      enableSorting: true,
      cell: ({ getValue }) => <ScrollableTextCell getValue={getValue} />,
    },

    value: {
      type: "string",
      nullable: true,
    },

    filter: true,
  },

  updateStatusAttempts: {
    label: "Попыток",

    column: {
      accessorFn: (message) => message.updateStatusAttempts,
      enableSorting: true,
    },

    value: {
      type: "number",
    },

    filter: true,
  },

  exchangeId: {
    label: "Exchange ID",

    column: {
      accessorFn: (message) => message.exchangeId,
      enableSorting: true,
    },

    value: {
      type: "string",
    },

    filter: true,
  },

  requestId: {
    label: "Request ID",

    column: {
      accessorFn: (message) => message.requestId,
      enableSorting: true,
    },

    value: {
      type: "string",
    },

    filter: true,
  },
} satisfies TableFieldRegistry<Message>;
