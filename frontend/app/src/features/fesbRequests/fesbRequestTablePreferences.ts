import type {
  TablePreferences,
} from "../../components/DataTable";

import {
  FESB_REQUEST_FIELD_REGISTRY,
} from "./fesbRequestFieldRegistry";


export const fesbRequestTablePreferences:
  TablePreferences = {
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
    },

    columnOrder: Object.entries(
      FESB_REQUEST_FIELD_REGISTRY,
    )
      .filter(
        ([, definition]) =>
          Boolean(definition.column),
      )
      .map(
        ([fieldId]) => fieldId,
      ),

    columnSizing: {},

    pageSize: 10,

    isLiveUpdatesEnabled: true,
  };
