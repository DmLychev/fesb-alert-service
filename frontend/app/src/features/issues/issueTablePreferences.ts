import type { TablePreferences } from "../../components/DataTable";

export const issueTablePreferences: TablePreferences = {
  version: 1,
  filters: [],
  sorting: [{ id: "createdAt", desc: true }],
  columnVisibility: {
    "type.description": false,
    updatedAt: false,
    routeId: false,
  },
  columnOrder: [
    "createdAt",
    "type.code",
    "type.description",
    "text",
    "domainName",
    "routeId",
    "isNotified",
    "isSolved",
    "updatedAt",
  ],
  columnSizing: {},
  pageSize: 10,
  isLiveUpdatesEnabled: false,
};
