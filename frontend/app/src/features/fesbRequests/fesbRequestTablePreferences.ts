import type { TablePreferences } from "../../components/DataTable";

export const fesbRequestTablePreferences: TablePreferences = {
  version: 1,

  filters: [],

  sorting: [
    {
      id: "createdAt",
      desc: true,
    },
  ],

  columnVisibility: {
    updatedAt: false,
    warningLevel: false,
  },

  columnOrder: [
    "createdAt",
    "updatedAt",
    "isSuccessful",
    "type.title",
    "details",
    "warningLevel",
  ],

  columnSizing: {},

  pageSize: 10,

  isLiveUpdatesEnabled: false,
};
