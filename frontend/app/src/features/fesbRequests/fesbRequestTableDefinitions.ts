import {
  createTableDefinitions,
} from "../../components/DataTable";

import {
  FESB_REQUEST_FIELD_REGISTRY,
} from "./fesbRequestFieldRegistry";


export const {
  columns: fesbRequestColumns,
  filterFields: fesbRequestFilterFields,
} = createTableDefinitions(
  FESB_REQUEST_FIELD_REGISTRY,
);
