import { Link, Tabs } from "@chakra-ui/react";
import Table from "../DataTable/index";
import type { ColumnMetadata, TablePreferences } from "../DataTable/types";
import StatusCell from "../DataTable/components/StatusCell";

const analyticsFieldRegistry: Record<string, ColumnMetadata> = {
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

const analyticsTablePreferences: TablePreferences = {
  version: 1,
  filters: [],
  sorting: [{ id: "startDate", desc: true }],
  columnVisibility: {},
  columnOrder: Object.keys(analyticsFieldRegistry).map((key) =>
    key.replace(/\./g, "_"),
  ),
  pageSize: 10,
};

const AnalyticsPage = () => {
  return (
    <Tabs.Root defaultValue="issues" variant="line">
      <Tabs.List>
        <Tabs.Trigger value="messages" asChild>
          <Link unstyled href="#messages">
            Сообщения
          </Link>
        </Tabs.Trigger>
        <Tabs.Trigger value="issues" asChild>
          <Link unstyled href="#issues">
            Инциденты
          </Link>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="messages">
        {/* <MessagePage /> */}
        <Table
          storageKey="message_table_settings"
          fieldRegistry={analyticsFieldRegistry}
          deafaultPreferences={analyticsTablePreferences}
        />
      </Tabs.Content>
      <Tabs.Content value="issues">Инциденты</Tabs.Content>
    </Tabs.Root>
  );
};

export default AnalyticsPage;
