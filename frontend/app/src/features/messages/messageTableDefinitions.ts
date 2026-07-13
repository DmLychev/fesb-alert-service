import { createTableDefinitions } from "../../components/DataTable";
import { MESSAGE_FIELD_REGISTRY } from "./messageFieldRegistry";

export const { columns: messageColumns, filterFields: messageFilterFields } =
  createTableDefinitions(MESSAGE_FIELD_REGISTRY);
