import type { DataTableEditingConfig } from "../../components/DataTable";
import { deleteIssues, updateIssue } from "./api/issueMutations";
import { issueEditableFields } from "./issueTableDefinitions";
import type { Issue } from "./types";

export const issueEditingConfig: DataTableEditingConfig<Issue> = {
  fields: issueEditableFields,
  updateRow: updateIssue,
  deleteRows: deleteIssues,
};
