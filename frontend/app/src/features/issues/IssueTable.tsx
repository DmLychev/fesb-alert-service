import { DataTable } from "../../components/DataTable";
import type { Issue } from "./types";
import { issueColumns, issueFilterFields } from "./issueTableDefinitions";
import { issueTablePreferences } from "./issueTablePreferences";
import fetchIssues from "./api/fetchIssues";
// import { messageLiveUpdateConfig } from "./api/messageLiveUpdates";
import { issueEditingConfig } from "./issueEditionConfig";

const IssueTable = () => {
  return (
    <DataTable<Issue>
      storageKey="issues-table"
      columns={issueColumns}
      filterFields={issueFilterFields}
      defaultPreferences={issueTablePreferences}
      fetchPage={fetchIssues}
      getRowId={(issue) => issue.id}
      // liveUpdates={messageLiveUpdateConfig}
      editing={issueEditingConfig}
    />
  );
};

export default IssueTable;
