import { DataTable } from "../../components/DataTable";

import fetchFesbRequests from "./api/fetchFesbRequests";

import {
  fesbRequestColumns,
  fesbRequestFilterFields,
} from "./fesbRequestTableDefinitions";

import { fesbRequestTablePreferences } from "./fesbRequestTablePreferences";

import { fesbRequestLiveUpdateConfig } from "./fesbRequestLiveUpdates";

import type { FesbRequest } from "./types";

const FesbRequestTable = () => {
  return (
    <DataTable<FesbRequest>
      storageKey="requests-table"
      columns={fesbRequestColumns}
      filterFields={fesbRequestFilterFields}
      defaultPreferences={fesbRequestTablePreferences}
      fetchPage={fetchFesbRequests}
      getRowId={(request) => request.id}
      liveUpdates={fesbRequestLiveUpdateConfig}
    />
  );
};

export default FesbRequestTable;
