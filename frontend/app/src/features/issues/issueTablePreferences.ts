import type { TablePreferences } from "../../components/DataTable";

export const issueTablePreferences: TablePreferences = {
  version: 1,
  filters: [
    {
      id: "f04ab132-0091-4b18-af04-7b83abfe04da",
      column: "isSolved",
      operation: "exact",
      value: "false",
    },
  ],
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
