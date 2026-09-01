import type { EditableFieldRegistry, EditableValue } from "./fields";

export type RowChanges = Record<string, EditableValue>;

export type PendingChanges = Record<string, RowChanges>;

export interface DraftCellChange {
  rowId: string;
  fieldId: string;
  value: EditableValue;
}

export interface UpdateRowParams {
  rowId: string;

  changes: Record<string, EditableValue>;

  signal: AbortSignal;
}

export interface DeleteRowsParams {
  rowIds: string[];
  signal: AbortSignal;
}

export interface DataTableEditingConfig<TData> {
  fields: EditableFieldRegistry;

  updateRow?: (params: UpdateRowParams) => Promise<TData>;

  deleteRows?: (params: DeleteRowsParams) => Promise<void>;

  canDeleteRow?: (row: TData) => boolean;
}
