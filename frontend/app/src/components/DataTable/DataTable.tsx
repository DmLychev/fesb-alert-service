import { Badge, Box, HStack, Stack, Text } from "@chakra-ui/react";
import {
  type ColumnDef,
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import useTablePreferences from "./hooks/useTablePreferences";
import type { DataTableProps, UiFilterRow } from "./types";
import { page_size_options, SELECT_COLUMN_ID } from "./constants";
import GlobalSearch from "./components/GlobalSearch";
import TableFooter from "./components/TableFooter";
import useUiState from "./hooks/useUiState";
import TableViewport from "./components/TableViewport";
import RowSelectionCheckbox from "./components/RowSelectionCheckbox";
import FilterPanel from "./components/FilterPanel";
import { LuPencil } from "react-icons/lu";
import DeleteRowsDialog from "./components/DeleteRowsDialog";
import useLiveUpdates from "./hooks/useLiveUpdates";
import useTableData from "./hooks/useTableData";
import TableToolbar from "./components/TableToolbar";
import EditingToolbarActions from "./components/EditingToolbarActions";
import DefaultToolbarActions from "./components/DefaultToolbarActions";
import useTableEditing from "./hooks/useTableEditing";

const DataTable = <TData,>({
  storageKey,
  columns,
  filterFields = {},
  defaultPreferences,
  fetchPage,
  getRowId,
  liveUpdates,
  editing,
}: DataTableProps<TData>) => {
  // Постоянные параметры таблицы, хранимые в локальном хранилище браузера
  const { preferences, updatePreferences } = useTablePreferences(
    storageKey,
    defaultPreferences,
  );

  // Временные параметры отображения таблицы
  const { uiState, updateUiState } = useUiState({
    globalSearch: "",
    draftFilters: preferences.filters,
    pageIndex: 0,
    isFilterPaneOpen: false,
  });

  const {
    rows: data,
    setRows: setData,
    totalCount,
    showSkeleton,
    isRefreshing,
    refresh: requestRefresh,
  } = useTableData<TData>({
    fetchPage,
    pageIndex: uiState.pageIndex,
    pageSize: preferences.pageSize,
    sorting: preferences.sorting,
    search: uiState.globalSearch,
    filters: preferences.filters,
  });

  const visibleRowIds = useMemo(() => {
    if (!getRowId) return new Set<string>();

    return new Set(data.map((row) => getRowId(row)));
  }, [data, getRowId]);

  const {
    isEditingMode,
    isApplyingChanges,
    isDeleting,
    pendingChanges,
    rowSelection,
    selectedRowIds,
    selectionEnabled,
    rowsWithPendingChanges,
    changedCellsCount,
    hasPendingChanges,
    canDeleteRow,
    handleRowSelectionChange,
    handleDraftChange,
    handleResetChanges,
    handleApplyChanges,
    handleDeleteRows,
    startEditing,
    exitEditing,
  } = useTableEditing<TData>({
    rows: data,
    setRows: setData,
    editing,
    getRowId,
    pageIndex: uiState.pageIndex,
    onPageIndexChange: (pageIndex) => updateUiState("pageIndex", pageIndex),
    refresh: requestRefresh,
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSearchSubmit = (value: string) => {
    updateUiState("globalSearch", value);
    updateUiState("pageIndex", 0);
  };

  const handleFilterSubmit = (submittedFilters: UiFilterRow[]) => {
    updateUiState("draftFilters", submittedFilters);
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

  const liveUpdatePauseReason = isEditingMode
    ? "editing"
    : uiState.pageIndex !== 0
      ? "not-first-page"
      : null;

  const { status: liveUpdateStatus } = useLiveUpdates({
    config: liveUpdates,
    enabled: preferences.isLiveUpdatesEnabled,
    pauseReason: liveUpdatePauseReason,
    visibleRowIds,
    onEvent: requestRefresh,
  });

  const effectiveColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!selectionEnabled) return columns;

    const selectionColumn: ColumnDef<TData, unknown> = {
      id: SELECT_COLUMN_ID,

      size: 44,
      minSize: 44,
      maxSize: 44,

      enableSorting: false,
      enableHiding: false,
      enableResizing: false,

      header: ({ table }) => (
        <RowSelectionCheckbox
          disabled={isDeleting || isApplyingChanges}
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(checked)
          }
        />
      ),

      cell: ({ row }) => (
        <RowSelectionCheckbox
          checked={row.getIsSelected()}
          disabled={isDeleting || isApplyingChanges}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
        />
      ),
    };

    return [selectionColumn, ...columns];
  }, [columns, selectionEnabled, isDeleting, isApplyingChanges]);

  const filteredColumnIds = useMemo(
    () =>
      new Set(
        preferences.filters.map((filter) => filter.column).filter(Boolean),
      ),
    [preferences.filters],
  );

  const hasFilterFields = Object.keys(filterFields).length > 0;

  const table = useReactTable<TData>({
    data: rowsWithPendingChanges,
    columns: effectiveColumns,
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
      rowSelection: rowSelection,
      columnPinning: selectionEnabled
        ? {
            left: [SELECT_COLUMN_ID],
            right: [],
          }
        : {
            left: [],
            right: [],
          },
    },
    manualPagination: true,
    manualSorting: true,
    rowCount: totalCount,
    enableColumnResizing: true,
    enableRowSelection: selectionEnabled
      ? (row) => canDeleteRow?.(row.original) !== false
      : false,
    columnResizeMode: "onChange",

    onColumnSizingChange: (updater) => {
      updatePreferences(
        "columnSizing",
        functionalUpdate(updater, preferences.columnSizing),
      );
    },

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

    onRowSelectionChange: handleRowSelectionChange,

    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    enableMultiSort: false,
  });

  const handleStartEditing = () => {
    updateUiState("isFilterPaneOpen", false);
    startEditing();
  };

  const editingLeft = (
    <HStack gap={2}>
      <LuPencil />

      <Text fontWeight="medium">Режим редактирования</Text>

      {hasPendingChanges && (
        <Badge colorPalette="orange">{changedCellsCount}</Badge>
      )}
    </HStack>
  );

  const defaultLeft = (
    <GlobalSearch
      key={uiState.globalSearch}
      value={uiState.globalSearch}
      onSubmit={handleSearchSubmit}
    />
  );

  const editingRight = (
    <EditingToolbarActions
      showDeleteButton={
        Boolean(editing?.deleteRows) && selectedRowIds.length > 0
      }
      isDeleting={isDeleting}
      isApplyingChanges={isApplyingChanges}
      hasPendingChanges={hasPendingChanges}
      changedCellsCount={changedCellsCount}
      onDeleteSelectedRows={() => setIsDeleteDialogOpen(true)}
      onResetChanges={handleResetChanges}
      onApplyChanges={handleApplyChanges}
      onExitEditing={exitEditing}
    />
  );

  const defaultRight = (
    <DefaultToolbarActions
      table={table}
      showEditButton={Boolean(editing?.updateRow)}
      isRefreshing={isRefreshing}
      hasFilterFields={hasFilterFields}
      isFilterPanelOpen={uiState.isFilterPaneOpen}
      activeFiltersCount={preferences.filters.length}
      columns={preferences.columnOrder}
      isLiveUpdatesEnabled={preferences.isLiveUpdatesEnabled}
      onStartEditing={handleStartEditing}
      onRefresh={requestRefresh}
      onToggleFilters={() =>
        updateUiState("isFilterPaneOpen", !uiState.isFilterPaneOpen)
      }
      onColumnOrderChange={(newOrder) =>
        updatePreferences("columnOrder", newOrder)
      }
      onLiveUpdatesEnabledChange={(enabled) =>
        updatePreferences("isLiveUpdatesEnabled", enabled)
      }
    />
  );

  const toolbarLeft = isEditingMode ? editingLeft : defaultLeft;

  const toolbarRight = isEditingMode ? editingRight : defaultRight;

  return (
    <Stack width="full" height="full" minHeight={0} gap={5} overflow="hidden">
      <TableToolbar left={toolbarLeft} right={toolbarRight} />

      {/* Панель фильтрации */}
      {hasFilterFields && uiState.isFilterPaneOpen && (
        <Box flexShrink={0}>
          <FilterPanel
            activeFilters={uiState.draftFilters}
            committedFilters={preferences.filters}
            filterFields={filterFields}
            onFiltersChange={(updater) => {
              const nextFilters =
                typeof updater === "function"
                  ? updater(uiState.draftFilters)
                  : updater;

              updateUiState("draftFilters", nextFilters);
            }}
            onFiltersSubmit={handleFilterSubmit}
          />
        </Box>
      )}

      <TableViewport
        table={table}
        showSkeleton={showSkeleton}
        pageSize={preferences.pageSize}
        editableFields={editing?.updateRow ? editing.fields : undefined}
        pendingChanges={pendingChanges}
        onDraftChange={editing?.updateRow ? handleDraftChange : undefined}
        isEditingMode={isEditingMode}
        isSelectionDisabled={isDeleting || isApplyingChanges}
        filteredColumnIds={filteredColumnIds}
      />

      {/* Пагинация */}
      {totalCount > 0 && !isEditingMode && (
        <Box flexShrink={0}>
          <TableFooter
            pageIndex={uiState.pageIndex}
            pageSize={preferences.pageSize}
            totalCount={totalCount}
            pageSizeOptions={page_size_options}
            onPageChange={(newPage: number) => {
              table.setPageIndex(newPage - 1);
            }}
            onPageSizeChange={(newSize) => table.setPageSize(newSize)}
            liveUpdateStatus={liveUpdateStatus}
          />
        </Box>
      )}

      <DeleteRowsDialog
        open={isDeleteDialogOpen}
        rowsCount={selectedRowIds.length}
        isDeleting={isDeleting}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={async () => {
          const wasDeleted = await handleDeleteRows(selectedRowIds);

          if (wasDeleted) setIsDeleteDialogOpen(false);
        }}
      />
    </Stack>
  );
};

export default DataTable;
