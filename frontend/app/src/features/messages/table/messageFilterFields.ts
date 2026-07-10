import type { FilterFieldRegistry } from "../../../components/DataTable/types";

const messageFilterFields: FilterFieldRegistry = {
  "route.domainName": {
    id: "route.domainName",
    label: "Домен",
    type: "string",
  },

  "route.name": {
    id: "route.name",
    label: "СОПС",
    type: "string",
  },

  status: {
    id: "status",
    label: "Статус",
    type: "choice",
    nullable: true,
    choices: [
      { value: "SUCCESS", label: "SUCCESS" },
      { value: "ERROR", label: "ERROR" },
    ],
  },

  startDate: {
    id: "startDate",
    label: "Начало обработки",
    type: "datetime",
  },

  errorMessage: {
    id: "errorMessage",
    label: "Текст ошибки",
    type: "string",
  },

  updateStatusAttempts: {
    id: "updateStatusAttempts",
    label: "Попыток",
    type: "number",
  },

  exchangeId: {
    id: "exchangeId",
    label: "Exchange ID",
    type: "string",
  },

  requestId: {
    id: "requestId",
    label: "Request ID",
    type: "string",
  },
};

export default messageFilterFields;
