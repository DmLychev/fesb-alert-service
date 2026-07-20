import type { ListCollection } from "@chakra-ui/react";
import {
  type Column,
  type ColumnDef,
  type ColumnSizingState,
  type PaginationState,
  type SortingState,
  type Table,
  type VisibilityState,
} from "@tanstack/react-table";

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
}

export type FilterFieldType =
  | "string"
  | "number"
  | "boolean"
  | "datetime"
  | "choice";

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

export type FilterFieldRegistry = Record<string, FilterFieldDefinition>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type RegistryColumnDef<TData> = DistributiveOmit<
  ColumnDef<TData, any>,
  "id" | "header" | "size" | "minSize"
>;

export interface TableFieldDefinition<TData> {
  label: string;
  defaultSize?: number;
  minSize?: number;
  column?: RegistryColumnDef<TData>;
  filter?: Omit<FilterFieldDefinition, "label"> | false;
}

export type TableFieldRegistry<Tdata> = Record<
  string,
  TableFieldDefinition<Tdata>
>;

export interface TableDefinitions<Tdata> {
  columns: ColumnDef<Tdata, any>[];
  filterFields: FilterFieldRegistry;
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
}

export interface TableViewProps<TData> {
  table: Table<TData>;
  showSkeleton: boolean;
  pageSize: number;
}

export interface GlobalSearchProps {
  value: string;
  onSubmit: (value: string) => void;
}

export interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export interface LiveUpdateToggleProps {
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface FilterButtonProps {
  isOpen: boolean;
  activeFiltersCount: number;
  onToggle: () => void;
}

export interface FilterVisibilityAndOrderProps<TData> {
  table: Table<TData>;
  columns: string[];
  onColumnOrderChange: (newOrder: string[]) => void;
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

export interface TablePaginationProps {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  pageSizeOptions: ListCollection<{
    value: string;
    label: string;
  }>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}
