import type { ColumnDef } from "@tanstack/react-table";
import type { TableDefinitions, TableFieldRegistry } from "./types";

export function createTableDefinitions<TData>(
  registry: TableFieldRegistry<TData>,
): TableDefinitions<TData> {
  const columns: ColumnDef<TData, any>[] = [];
  const filterFields: TableDefinitions<TData>["filterFields"] = {};

  for (const [fieldId, definition] of Object.entries(registry)) {
    if (definition.column)
      columns.push({
        ...definition.column,
        id: fieldId,
        header: definition.label,
      } as ColumnDef<TData, any>);

    if (definition.filter)
      filterFields[fieldId] = {
        label: definition.label,
        ...definition.filter,
      };
  }

  return {
    columns,
    filterFields,
  };
}
