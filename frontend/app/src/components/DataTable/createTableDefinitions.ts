import type { ColumnDef } from "@tanstack/react-table";
import type { TableDefinitions, TableFieldRegistry } from "./types";

export function createTableDefinitions<TData>(
  registry: TableFieldRegistry<TData>,
): TableDefinitions<TData> {
  const columns: ColumnDef<TData, any>[] = [];
  const filterFields: TableDefinitions<TData>["filterFields"] = {};
  const sortFields: TableDefinitions<TData>["sortFields"] = {};

  for (const [fieldId, definition] of Object.entries(registry)) {
    const defaultPath = definition.path ?? fieldId.split(".");

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
        path: definition.filter.path ?? defaultPath,
      };

    const sortingEnabled =
      definition.column !== undefined &&
      definition.column.enableSorting !== false &&
      definition.sorting !== false;

    if (sortingEnabled) {
      sortFields[fieldId] = {
        path: definition.sorting?.path && defaultPath,
      };
    }
  }

  return {
    columns,
    filterFields,
    sortFields,
  };
}
