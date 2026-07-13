import type { TablePreferences } from "../../components/DataTable";
import { MESSAGE_FIELD_REGISTRY } from "./messageFieldRegistry";

export const messageTablePreferences: TablePreferences = {
  version: 1,
  filters: [],
  sorting: [{ id: "startDate", desc: true }],
  columnVisibility: {},
  columnOrder: Object.entries(MESSAGE_FIELD_REGISTRY)
    .filter(([, definition]) => Boolean(definition.column))
    .map(([fieldId]) => fieldId),
  pageSize: 10,
};
