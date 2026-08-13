import { createTableDefinitions } from "../../components/DataTable";
import { ISSUE_FIELD_REGISTRY } from "./issueFieldRegistry";

export const {
  columns: issueColumns,
  filterFields: issueFilterFields,
  editableFields: issueEditableFields,
} = createTableDefinitions(ISSUE_FIELD_REGISTRY);
