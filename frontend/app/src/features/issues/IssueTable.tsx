import { DataTable } from "../../components/DataTable";
import type { Issue } from "./types";
import { issueColumns, issueFilterFields } from "./issueTableDefinitions";
import { issueTablePreferences } from "./issueTablePreferences";
import fetchIssues from "./api/fetchIssues";
import { issueLiveUpdateConfig } from "./issueLiveUpdates";
import { issueEditingConfig } from "./issueEditingConfig";

const IssueTable = () => (
  <DataTable<Issue>
    storageKey="issues-table"
    columns={issueColumns}
    filterFields={issueFilterFields}
    defaultPreferences={issueTablePreferences}
    fetchPage={fetchIssues}
    getRowId={(issue) => issue.id}
    liveUpdates={issueLiveUpdateConfig}
    editing={issueEditingConfig}
  />
);

export default IssueTable;
