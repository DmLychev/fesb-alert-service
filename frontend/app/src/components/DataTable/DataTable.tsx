import { Flex, HStack, Stack } from "@chakra-ui/react";
import {
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { toaster } from "../ui/toaster";

import useTablePreferences from "./hooks/useTablePreferences";
import type { DataTableProps, UiFilterRow } from "./types";
import { page_size_options } from "./constants";
import GlobalSearch from "./components/GlobalSearch";
import FilterButton from "./components/FilterButton";
import FilterVisibilityAndOrder from "./components/FilterVisibilityAndOrder";
import FilterPanel from "./components/FilterPanel";
import TablePagination from "./components/TablePagination";
import useUiState from "./hooks/useUiState";
import TableView from "./components/TableView";

const DataTable = <TData,>({
  storageKey,
  columns,
  filterFields = {},
  defaultPreferences,
  fetchPage,
  getRowId,
}: DataTableProps<TData>) => {
  // Постоянные параметры таблицы, хранимые в локальном хранилище браузера
  const { preferences, updatePreferences } = useTablePreferences(
    storageKey,
    defaultPreferences,
  );

  // Временные параметры отображения таблицы
  const { uiState, updateUiState } = useUiState({
    globalSearch: "",
    displayedFilters: preferences.filters,
    pageIndex: 0,
    totalCount: 0,
    isFilterBlockOpen: false,
  });

  const [data, setData] = useState<TData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearchSubmit = (value: string) => {
    updateUiState("globalSearch", value);
    updateUiState("pageIndex", 0);
  };

  const handleFilterSubmit = (submittedFilters: UiFilterRow[]) => {
    updateUiState("displayedFilters", submittedFilters);
    updateUiState("pageIndex", 0);
    updatePreferences("filters", submittedFilters);
  };

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const currentPagination: PaginationState = {
      pageIndex: uiState.pageIndex,
      pageSize: preferences.pageSize,
    };

    const nextPagination =
      typeof updater === "function" ? updater(currentPagination) : updater;

    if (nextPagination.pageIndex !== currentPagination.pageIndex)
      updateUiState("pageIndex", nextPagination.pageIndex);

    if (nextPagination.pageSize !== currentPagination.pageSize) {
      updatePreferences("pageSize", nextPagination.pageSize);
      updateUiState("pageIndex", 0);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    let skeletonTimer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        skeletonTimer = setTimeout(() => {
          setLoading(true);
        }, 200);

        const result = await fetchPage({
          pagination: {
            pageIndex: uiState.pageIndex,
            pageSize: preferences.pageSize,
          },
          sorting: preferences.sorting,
          search: uiState.globalSearch,
          filters: preferences.filters,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setData(result.rows);
        updateUiState("totalCount", result.totalCount);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        toaster.create({
          title: error instanceof Error ? error.message : "Error loading data",
          type: "error",
          duration: 6000,
        });
      } finally {
        if (skeletonTimer) clearTimeout(skeletonTimer);

        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();

    return () => {
      controller.abort();

      if (skeletonTimer) clearTimeout(skeletonTimer);
    };
  }, [
    fetchPage,
    uiState.pageIndex,
    preferences.pageSize,
    preferences.sorting,
    preferences.filters,
    uiState.globalSearch,
  ]);

  const table = useReactTable<TData>({
    data,
    columns,
    getRowId,

    state: {
      sorting: preferences.sorting,
      columnVisibility: preferences.columnVisibility,
      columnOrder: preferences.columnOrder,
      columnSizing: preferences.columnSizing,
      pagination: {
        pageSize: preferences.pageSize,
        pageIndex: uiState.pageIndex,
      },
    },
    manualPagination: true,
    manualSorting: true,
    rowCount: uiState.totalCount,
    enableColumnResizing: true,
    columnResizeMode: "onEnd",

    onSortingChange: (updater) => {
      updatePreferences(
        "sorting",
        functionalUpdate(updater, preferences.sorting),
      );

      updateUiState("pageIndex", 0);
    },

    onColumnVisibilityChange: (updater) =>
      updatePreferences(
        "columnVisibility",
        functionalUpdate(updater, preferences.columnVisibility),
      ),

    onColumnOrderChange: (updater) =>
      updatePreferences(
        "columnOrder",
        functionalUpdate(updater, preferences.columnOrder),
      ),

    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    enableMultiSort: false,
  });

  const hasFilterFields = Object.keys(filterFields).length > 0;

  return (
    <Stack width="full" gap={5}>
      <Flex justifyContent="space-between" gap={4}>
        {/* Глобальный поиск */}
        <GlobalSearch
          value={uiState.globalSearch}
          onSubmit={handleSearchSubmit}
        />

        <HStack gap={2}>
          {/* Кнопка фильтрации */}
          {hasFilterFields && (
            <FilterButton
              isOpen={uiState.isFilterBlockOpen}
              activeFiltersCount={uiState.displayedFilters.length}
              onToggle={() =>
                updateUiState("isFilterBlockOpen", !uiState.isFilterBlockOpen)
              }
            />
          )}

          {/* Выбор отображаемых столбцов */}
          <FilterVisibilityAndOrder
            table={table}
            columns={preferences.columnOrder}
            onColumnOrderChange={(newOrder) =>
              updatePreferences("columnOrder", newOrder)
            }
          />
        </HStack>
      </Flex>

      {/* Панель фильтрации */}
      {hasFilterFields && uiState.isFilterBlockOpen && (
        <FilterPanel
          activeFilters={uiState.displayedFilters}
          committedFilters={preferences.filters}
          filterFields={filterFields}
          onFiltersChange={(updater) => {
            const nextFilters =
              typeof updater === "function"
                ? updater(uiState.displayedFilters)
                : updater;

            updateUiState("displayedFilters", nextFilters);
          }}
          onFiltersSubmit={handleFilterSubmit}
        />
      )}

      {/* Таблица */}
      <TableView
        table={table}
        showSkeleton={loading}
        pageSize={preferences.pageSize}
      />

      {/* Пагинация */}
      {uiState.totalCount > 0 && (
        <TablePagination
          pageIndex={uiState.pageIndex}
          pageSize={preferences.pageSize}
          totalCount={uiState.totalCount}
          pageSizeOptions={page_size_options}
          onPageChange={(newPage: number) => {
            table.setPageIndex(newPage - 1);
          }}
          onPageSizeChange={(newSize) => table.setPageSize(newSize)}
        />
      )}
    </Stack>
  );
};

export default DataTable;
