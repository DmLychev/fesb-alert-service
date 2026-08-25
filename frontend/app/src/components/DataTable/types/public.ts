import {
  type ColumnSizingState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import type { HeterogeneousColumnDef } from "./fields";
import type { FilterFieldRegistry, UiFilterRow } from "./filters";
import type { LiveUpdateConfig } from "./liveUpdates";
import type { DataTableEditingConfig } from "./editing";
import type { ReactNode } from "react";

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
  columns: HeterogeneousColumnDef<Tdata>[];
  filterFields?: FilterFieldRegistry;
  defaultPreferences: TablePreferences;

  fetchPage: (params: FetchPageParams) => Promise<PageResult<Tdata>>;
  getRowId?: (row: Tdata) => string;
  liveUpdates?: LiveUpdateConfig;

  editing?: DataTableEditingConfig<Tdata>;

  toolbarActions?: ReactNode;
}
