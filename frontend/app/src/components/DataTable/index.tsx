import { Flex, HStack, Stack } from "@chakra-ui/react";
import {
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import { toaster } from "../ui/toaster";

import useTablePreferences from "./hooks/useTablePreferences";
import { FIELD_REGISTRY } from "./constants/fieldRegistry";
import type { DataTableProps, TableProps, UiFilterRow } from "./types";
import { page_size_options } from "./constants";
import type { Message } from "../models";
import { create_tanstack_columns } from "./utils/tableColumnCreator";
import GlobalSearch from "./components/GlobalSearch";
import compileGraphQLFilters from "./utils/graphqlCompiler";
import FilterButton from "./components/FilterButton";
import FilterVisibilityAndOrder from "./components/FilterVisibilityAndOrder";
import FilterPanel from "./components/FilterPanel";
import DataTable from "./components/DataTable";
import TablePagination from "./components/TablePagination";
import useUiState from "./hooks/useUiState";

const Table = <TData,>({
  storageKey,
  columns,
  filterFields,
  defaultPreferences,
  fetchPage,
  getRowId,
}: DataTableProps<TData>) => {
  // Постоянные параметры таблицы, хранимые в локальном хранилище браузера
  const { preferences, updatePreferences } = useTablePreferences(storageKey, {
    version: 1,
    filters: [],
    sorting: [{ id: "startDate", desc: true }],
    columnVisibility: {},
    columnOrder: Object.keys(FIELD_REGISTRY).map((key) =>
      key.replace(/\./g, "_"),
    ),
    pageSize: 10,
  });

  // Временные параметры отображения таблицы
  const { uiState, updateUiState } = useUiState({
    globalSearch: "",
    displayedFilters: preferences.filters,
    pageIndex: 0,
    totalCount: 0,
    isFilterBlockOpen: false,
  });

  // const [data, setData] = useState<Message[]>([]);
  const [data, setData] = useState<TData[]>([]);
  const [loading, setLoading] = useState(true);

  // Запомнить названия столбцов
  const tableColumns = useMemo(
    () => create_tanstack_columns(FIELD_REGISTRY),
    [],
  );

  const handleFilterSubmit = (submittedFilters: UiFilterRow[]) => {
    updateUiState("displayedFilters", submittedFilters);
    updatePreferences("filters", submittedFilters);
  };

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const currentPagination = {
      pageSize: preferences.pageSize,
      pageIndex: uiState.pageIndex,
    };

    const newPagination =
      typeof updater === "function" ? updater(currentPagination) : updater;

    if (newPagination.pageIndex !== currentPagination.pageIndex)
      updateUiState("pageIndex", newPagination.pageIndex);

    if (newPagination.pageSize !== currentPagination.pageSize)
      updatePreferences("pageSize", newPagination.pageSize);
  };

  // Загрузить данные через api
  // useEffect(() => {
  //   let skeletonTimer: ReturnType<typeof setTimeout>; // NodeJS.Timeout

  //   const fetchMessages = async () => {
  //     try {
  //       // Показывать скелеты, если запрос выполняется дольше 200мс
  //       skeletonTimer = setTimeout(() => {
  //         setLoading(true);
  //       }, 200);

  //       let graphqlSortingPayload: Record<string, any> | null = null;
  //       if (preferences.sorting.length > 0) {
  //         const activeSort = preferences.sorting[0];
  //         const sortDirection = activeSort.desc ? "DESC" : "ASC";

  //         // Check if we are sorting by a nested relation column property (e.g., 'route.domainName')
  //         if (activeSort.id.includes("_")) {
  //           const [parent, child] = activeSort.id.split("_");
  //           graphqlSortingPayload = {
  //             [parent]: {
  //               [child]: sortDirection,
  //             },
  //           };
  //         } else {
  //           // Standard root column ordering (e.g., 'startDate')
  //           graphqlSortingPayload = {
  //             [activeSort.id]: sortDirection,
  //           };
  //         }
  //       }

  //       const graphqlQuery = `
  //       query GetFilteredPage($page: Int!, $size: Int!, $filters: MessageFilter, $search: String, $order: MessageOrder) {
  //         messagesPage(page: $page, size: $size, filters: $filters, search: $search, order: $order) {
  //           count
  //           results {
  //             exchangeId
  //             requestId
  //             status
  //             errorMessage
  //             updateStatusAttempts
  //             startDate
  //             route {
  //               name
  //               domainName
  //             }
  //           }
  //         }
  //       }
  //     `;

  //       const payload = {
  //         query: graphqlQuery,
  //         variables: {
  //           page: uiState.pageIndex + 1,
  //           size: preferences.pageSize,
  //           filters: compileGraphQLFilters(preferences.filters, FIELD_REGISTRY),
  //           search: uiState.globalSearch || undefined,
  //           order: graphqlSortingPayload,
  //         },
  //       };

  //       const res = await api.post("/api/graphql", payload);
  //       const dataPayload = res.data.data.messagesPage;

  //       setData(dataPayload.results);
  //       updateUiState("totalCount", dataPayload.count);
  //     } catch (error: any) {
  //       toaster.create({
  //         title: error.message,
  //         type: "error",
  //         duration: 6000,
  //       });
  //     } finally {
  //       clearTimeout(skeletonTimer);
  //       setLoading(false);
  //       setLoading(false);
  //     }
  //   };

  //   fetchMessages();
  //   return () => clearTimeout(skeletonTimer);
  // }, [
  //   uiState.pageIndex,
  //   preferences.pageSize,
  //   preferences.filters,
  //   uiState.globalSearch,
  //   preferences.sorting,
  // ]);

  useEffect(() => {
    const controller = new AbortController();

    let skeletonTimer: ReturnType<typeof setTimeout>; // NodeJS.Timeout

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

        setData(result.rows);
        // setTotalCount(result.totalCount);
        updateUiState("totalCount", result.totalCount);
      } catch (error) {
        if (!controller.signal.aborted) {
          toaster.create({
            title: error.message,
            type: "error",
            duration: 6000,
          });
        }
      } finally {
        clearTimeout(skeletonTimer);
        setLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [
    fetchPage,
    uiState.pageIndex,
    preferences.pageSize,
    preferences.sorting,
    preferences.filters,
    uiState.globalSearch,
  ]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting: preferences.sorting,
      // globalFilter: uiState.globalSearch,
      // columnFilters: preferences.filters,
      columnVisibility: preferences.columnVisibility,
      pagination: {
        pageSize: preferences.pageSize,
        pageIndex: uiState.pageIndex,
      },
      columnOrder: preferences.columnOrder,
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount: uiState.totalCount,
    onSortingChange: (updater) =>
      updatePreferences(
        "sorting",
        functionalUpdate(updater, preferences.sorting),
      ),
    onGlobalFilterChange: (e) => updateUiState("globalSearch", e),
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

  return (
    <Stack width="full" gap={5}>
      <Flex justifyContent="space-between" gap={4}>
        {/* Глобальный поиск */}
        <GlobalSearch
          globalSearchInput={uiState.globalSearch}
          onGlobalSearchSubmit={(e) => updateUiState("globalSearch", e)}
        />

        <HStack gap={2}>
          {/* Кнопка фильтрации */}
          <FilterButton
            isFilterPanelOpened={uiState.isFilterBlockOpen}
            activeFiltersCount={uiState.displayedFilters.length}
            onFilterButtonClick={() =>
              updateUiState("isFilterBlockOpen", !uiState.isFilterBlockOpen)
            }
          />

          {/* Выбор отображаемых столбцов */}
          <FilterVisibilityAndOrder
            table={table}
            columns={preferences.columnOrder}
            onColumnsVisibilityAndOrderChange={(newOrder) =>
              updatePreferences("columnOrder", newOrder)
            }
          />
        </HStack>
      </Flex>

      {/* Панель фильтрации */}
      {uiState.isFilterBlockOpen && (
        <FilterPanel
          activeFilters={uiState.displayedFilters}
          commitedFilters={preferences.filters}
          fieldRegistry={FIELD_REGISTRY}
          onFiltersChange={(props) => updateUiState("displayedFilters", props)}
          onFiltersSubmit={handleFilterSubmit}
        />
      )}

      {/* Таблица */}
      <DataTable
        table={table}
        showSkeleton={loading}
        pageSize={preferences.pageSize}
      />

      {/* Пагинация */}
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
    </Stack>
  );
};

export default Table;
