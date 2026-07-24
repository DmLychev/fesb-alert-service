import {
  type Column,
  type ColumnDef,
  type ColumnSizingState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Table,
  type VisibilityState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

export interface UiFilterRow {
  id: string;
  column: string;
  operation: string;
  value: string;
}

export interface LiveUpdateConfig {
  createConnectionUrl: (signal: AbortSignal) => Promise<string>;
  eventType?: string;
  debounceMs?: number;
}

export interface TablePreferences {
  version: number;
  sorting: SortingState;
  columnVisibility: VisibilityState;
  columnOrder: string[];
  columnSizing: ColumnSizingState;
  filters: UiFilterRow[];
  pageSize: number;
  isLiveUpdatesEnabled: boolean;
}

export interface TableUiState {
  globalSearch: string;
  displayedFilters: UiFilterRow[];
  pageIndex: number;
  totalCount: number;
  isFilterBlockOpen: boolean;
  showSkeleton: boolean;
  refreshVersion: number;
  isRefreshing: boolean;
  rowSelection: RowSelectionState;
  isMutating: boolean;
  pendingChanges: PendingChanges;
  isApplyingChanges: boolean;
  liveUpdateStatus: LiveUpdateStatus;
  isEditingMode: boolean;
}

export type FilterFieldType =
  | "string"
  | "number"
  | "boolean"
  | "datetime"
  | "choice";

export type LiveUpdateStatus =
  | "off"
  | "connecting"
  | "connected"
  | "disconnected"
  | "paused";

export interface FilterChoice {
  value: string;
  label: string;
}

export interface FilterFieldDefinition {
  label: string;
  type: FilterFieldType;
  nullable?: boolean;
  choices?: readonly FilterChoice[];
}

export interface EditableFieldDefinition
  extends FilterFieldDefinition, EditDefinition {}

export type FilterFieldRegistry = Record<string, FilterFieldDefinition>;

export type EditableFieldRegistry = Record<string, EditableFieldDefinition>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type RegistryColumnDef<TData> = DistributiveOmit<
  ColumnDef<TData, any>,
  "id" | "header" | "size" | "minSize"
>;

export interface EditDefinition {
  control?: "input" | "textarea";

  renderEditor?: (props: EditableControlProps) => ReactNode;
}

export interface TableFieldDefinition<TData> {
  label: string;
  defaultSize?: number;
  minSize?: number;
  column?: RegistryColumnDef<TData>;
  value?: Omit<FilterFieldDefinition, "label">;
  filter?: boolean;
  edit?: boolean | EditDefinition;
}

export type TableFieldRegistry<Tdata> = Record<
  string,
  TableFieldDefinition<Tdata>
>;

export interface TableDefinitions<Tdata> {
  columns: ColumnDef<Tdata, any>[];
  filterFields: FilterFieldRegistry;
  editableFields: EditableFieldRegistry;
}

export interface PageResult<TData> {
  rows: TData[];
  totalCount: number;
}

export interface FetchPageParams {
  pagination: PaginationState;
  sorting: SortingState;
  search: string;
  filters: UiFilterRow[];
  signal: AbortSignal;
}

export interface DataTableProps<Tdata> {
  storageKey: string;
  columns: ColumnDef<Tdata, any>[];
  filterFields?: FilterFieldRegistry;
  defaultPreferences: TablePreferences;

  fetchPage: (params: FetchPageParams) => Promise<PageResult<Tdata>>;
  getRowId?: (row: Tdata) => string;
  liveUpdates?: LiveUpdateConfig;

  editing?: DataTableEditingConfig<Tdata>;
}

export interface TableViewProps<TData> {
  table: Table<TData>;
  showSkeleton: boolean;
  pageSize: number;

  editableFields?: EditableFieldRegistry;

  pendingChanges?: PendingChanges;

  isApplyingChanges?: boolean;

  onDraftChange?: (change: DraftCellChange) => void;

  isEditingMode: boolean;
}

export interface GlobalSearchProps {
  value: string;
  onSubmit: (value: string) => void;
}

export interface FilterButtonProps {
  isOpen: boolean;
  activeFiltersCount: number;
  onToggle: () => void;
}

export interface SortableColumnItemProps<Tdata> {
  id: string;
  column: Column<Tdata, any>;
}

export interface FilterPanelProps {
  activeFilters: UiFilterRow[];
  committedFilters: UiFilterRow[];
  filterFields: FilterFieldRegistry;
  onFiltersChange: React.Dispatch<React.SetStateAction<UiFilterRow[]>>;
  onFiltersSubmit: (filters: UiFilterRow[]) => void;
}

export type EditableValue = string | number | boolean | null;

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

  deleteRows: (params: DeleteRowsParams) => Promise<void>;

  canDeleteRow?: (row: TData) => boolean;
}

export interface EditableControlProps {
  value: EditableValue;
  disabled?: boolean;

  onChange: (value: EditableValue) => void;
}

export type ToolbarMode = "default" | "editing" | "selection";
