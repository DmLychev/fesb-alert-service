import type { ColumnDef } from "@tanstack/react-table";
import type {
  EditableFieldRegistry,
  FilterFieldRegistry,
  TableDefinitions,
  TableFieldRegistry,
} from "./types";

export function createTableDefinitions<TData>(
  registry: TableFieldRegistry<TData>,
): TableDefinitions<TData> {
  const columns: ColumnDef<TData, unknown>[] = [];
  const filterFields: FilterFieldRegistry = {};
  const editableFields: EditableFieldRegistry = {};

  for (const [fieldId, definition] of Object.entries(registry)) {
    if (definition.column)
      columns.push({
        ...definition.column,
        id: fieldId,
        header: definition.label,
        ...(definition.defaultSize !== undefined
          ? { size: definition.defaultSize }
          : {}),
        ...(definition.minSize !== undefined
          ? { minSize: definition.minSize }
          : {}),
      } as ColumnDef<TData, any>);

    if (definition.filter) {
      if (!definition.value)
        throw new Error(`Filterable field ${fieldId} has no value definition`);

      filterFields[fieldId] = {
        label: definition.label,
        ...definition.value,
      };
    }

    if (definition.edit) {
      if (!definition.value)
        throw new Error(`Editable field ${fieldId} has no value definition`);

      const editOptions = definition.edit === true ? {} : definition.edit;

      editableFields[fieldId] = {
        label: definition.label,
        ...definition.value,
        ...editOptions,
      };
    }
  }

  return {
    columns,
    filterFields,
    editableFields,
  };
}
