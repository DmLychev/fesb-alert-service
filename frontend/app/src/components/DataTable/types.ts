import type { ListCollection } from "@chakra-ui/react";
import {
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

export interface TablePreferences {
  version: number;
  sorting: SortingState;
  columnVisibility: VisibilityState;
  columnOrder: string[];
  filters: UiFilterRow[];
  pageSize: number;
}

export interface TableUIState {
  globalSearch: string;
  displayedFilters: UiFilterRow[];
  pageIndex: number;
  totalCount: number;
  isFilterBlockOpen: boolean;
}

type ColumnType = "string" | "number" | "boolean" | "datetime" | "choice";

export interface ColumnMetadata {
  label: string;
  type: ColumnType;
  nullable?: boolean;
  choices?: { value: string; label: string }[];
  renderCell?: (value: any) => React.ReactNode;
}

export type DateTimeString = string;

export interface GlobalSearchProps {
  globalSearchInput: string;
  onGlobalSearchSubmit: (value: string) => void;
}

export interface FilterButtonProps {
  isFilterPanelOpened: boolean;
  activeFiltersCount: number;
  onFilterButtonClick: (isFilterPanelOpened: boolean) => void;
}

export interface FilterVisibilityAndOrderProps {
  table: Table<unknown>;
  columns: string[];
  onColumnsVisibilityAndOrderChange: (newOrder: string[]) => void;
}

export interface FilterPanelProps {
  activeFilters: UiFilterRow[];
  commitedFilters: any;
  fieldRegistry: Record<string, ColumnMetadata>;
  onFiltersChange: React.Dispatch<React.SetStateAction<UiFilterRow[]>>;
  onFiltersSubmit: React.Dispatch<any>;
}

export interface DataTableProps {
  table: Table<unknown>;
  showSkeleton: boolean;
  pageSize: number;
}

export interface TablePaginationProps {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  pageSizeOptions: ListCollection<{
    value: string;
    label: string;
  }>;
  onPageChange: (newPageIndex: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

export interface TableProps {
  storageKey: string;
  deafaultPreferences: TablePreferences;
  fieldRegistry: Record<string, ColumnMetadata>;
}
