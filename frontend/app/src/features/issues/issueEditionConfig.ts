import type { DataTableEditingConfig } from "../../components/DataTable";
import { deleteMessages, updateMessage } from "./api/messageMutations";
import { issueEditableFields } from "./issueTableDefinitions";
import type { Issue } from "./types";

export const issueEditingConfig: DataTableEditingConfig<Issue> = {
  fields: issueEditableFields,
  updateRow: updateMessage,
  deleteRows: deleteMessages,
};
