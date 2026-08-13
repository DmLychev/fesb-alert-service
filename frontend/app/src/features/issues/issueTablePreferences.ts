import type { TablePreferences } from "../../components/DataTable";
import { ISSUE_FIELD_REGISTRY } from "./issueFieldRegistry";

export const issueTablePreferences: TablePreferences = {
  version: 1,
  filters: [],
  sorting: [{ id: "createdAt", desc: true }],
  columnVisibility: { "type.description": false },
  columnOrder: Object.entries(ISSUE_FIELD_REGISTRY)
    .filter(([, definition]) => Boolean(definition.column))
    .map(([fieldId]) => fieldId),
  columnSizing: {},
  pageSize: 10,
  isLiveUpdatesEnabled: false,
};
