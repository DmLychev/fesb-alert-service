import { Badge, Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import {
  type ColumnDef,
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toaster } from "../ui/toaster";

import useTablePreferences from "./hooks/useTablePreferences";
import type {
  DataTableProps,
  DraftCellChange,
  EditableValue,
  PendingChanges,
  UiFilterRow,
  ToolbarMode,
} from "./types";
import { page_size_options, SELECT_COLUMN_ID } from "./constants";
import GlobalSearch from "./components/GlobalSearch";
import FilterButton from "./components/FilterButton";
import TablePagination from "./components/TablePagination";
import useUiState from "./hooks/useUiState";
import TableView from "./components/TableView";
import RefreshButton from "./components/RefreshButton";
import RowSelectionCheckbox from "./components/RowSelectionCheckbox";
import DeleteSelectedRowsButton from "./components/DeleteSelectedRowsButton";
import ApplyAllChangesButton from "./components/ApplyAllChangesButton";
import ResetAllChangesButton from "./components/ResetAllChangesButton";
import TableToolbar from "./components/TableToolbar";
import FilterPanel from "./components/FilterPanel";
import TableSettings from "./components/TableSettings";
import EditingModeButton from "./components/EditingModeButton";
import { LuLogOut, LuPencil } from "react-icons/lu";
import DeleteRowsDialog from "./components/DeleteRowsDialog";

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
    displayedFilters: preferences.filters,
    pageIndex: 0,
    totalCount: 0,
    isFilterBlockOpen: false,
    showSkeleton: false,
    refreshVersion: 0,
    isRefreshing: false,
    rowSelection: {},
    isMutating: false,
    pendingChanges: {},
    isApplyingChanges: false,
    liveUpdateStatus: "off",
    isEditingMode: false,
  });

  const [data, setData] = useState<TData[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const requestRefresh = useCallback(() => {
    updateUiState("isRefreshing", true);
    updateUiState("refreshVersion", (prev) => prev + 1);
  }, [updateUiState]);

  useEffect(() => {
    const controller = new AbortController();

    let skeletonTimer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      const refreshStartedAt = performance.now();

      try {
        skeletonTimer = setTimeout(() => {
          updateUiState("showSkeleton", true);
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

        const elapsed = performance.now() - refreshStartedAt;
        const remainingAnimationTime = Math.max(0, 300 - elapsed);
        if (remainingAnimationTime > 0) {
          await new Promise<void>((resolve) =>
            setTimeout(resolve, remainingAnimationTime),
          );
        }

        if (!controller.signal.aborted) {
          updateUiState("showSkeleton", false);
          updateUiState("isRefreshing", false);
        }
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
    uiState.refreshVersion,
  ]);

  const handleDeleteRows = useCallback(
    async (rowIds: string[]): Promise<Boolean> => {
      if (!editing?.deleteRows || rowIds.length === 0) return false;

      const controller = new AbortController();

      try {
        updateUiState("isMutating", true);

        await editing.deleteRows({ rowIds, signal: controller.signal });

        updateUiState("rowSelection", {});

        const remainingRows = data.filter((row) => {
          const rowId = getRowId?.(row);

          return rowId === undefined || !rowIds.includes(rowId);
        });

        if (remainingRows.length === 0 && uiState.pageIndex > 0) {
          updateUiState("pageIndex", uiState.pageIndex - 1);
        } else {
          requestRefresh();
        }

        toaster.create({
          title:
            rowIds.length === 1
              ? "Запись удалена"
              : `Удалено записей: ${rowIds.length}`,
          type: "success",
          duration: 3000,
        });

        return true;
      } catch (error: unknown) {
        toaster.create({
          title:
            error instanceof Error
              ? error.message
              : "Не удалось удалить записи",
          type: "error",
          duration: 6000,
        });

        return false;
      } finally {
        updateUiState("isMutating", false);
      }
    },
    [data, editing, getRowId, requestRefresh, uiState.pageIndex, updateUiState],
  );

  const isLiveUpdatesPaused = uiState.isEditingMode || uiState.pageIndex !== 0;

  useEffect(() => {
    if (
      !preferences.isLiveUpdatesEnabled ||
      !liveUpdates?.createConnectionUrl
    ) {
      updateUiState("liveUpdateStatus", "off");
      return;
    }

    if (isLiveUpdatesPaused) {
      updateUiState("liveUpdateStatus", "paused");
      return;
    }

    updateUiState("liveUpdateStatus", "connecting");

    const controller = new AbortController();
    let socket: WebSocket | null = null;
    let closedByCleanup = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = async () => {
      try {
        const connectionUrl = await liveUpdates.createConnectionUrl(
          controller.signal,
        );

        if (controller.signal.aborted) return;

        socket = new WebSocket(connectionUrl);

        socket.onopen = () => updateUiState("liveUpdateStatus", "connected");

        socket.onmessage = (message) => {
          try {
            const payload: unknown = JSON.parse(message.data);

            if (typeof payload !== "object" || payload === null) return;

            const eventType =
              "type" in payload
                ? (payload as { type?: unknown }).type
                : undefined;

            if (liveUpdates.eventType && eventType !== liveUpdates.eventType)
              return;

            if (refreshTimer) clearTimeout(refreshTimer);

            refreshTimer = setTimeout(
              () => requestRefresh(),
              liveUpdates.debounceMs,
            );
          } catch {
            toaster.create({
              title: `Invalid WebSocket message:${message.data}`,
              type: "error",
              duration: 6000,
            });
          }
        };

        socket.onerror = () => {
          updateUiState("liveUpdateStatus", "disconnected");

          toaster.create({
            title: "WebSocket connection error",
            type: "error",
            duration: 6000,
          });
        };

        socket.onclose = () => {
          if (closedByCleanup) return;

          updateUiState("liveUpdateStatus", "disconnected");

          toaster.create({
            title: "Соединение автообновления закрыто",
            description:
              "Включите автообновление повторно, чтобы переподключиться",
            type: "warning",
            duration: 6000,
          });
        };
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        updateUiState("liveUpdateStatus", "disconnected");

        toaster.create({
          title: "Не удалось получить WebSocket ticket",
          description: error instanceof Error ? error.message : undefined,
          type: "error",
          duration: 6000,
        });
      }
    };

    void connect();

    return () => {
      closedByCleanup = true;
      controller.abort();

      if (refreshTimer) clearTimeout(refreshTimer);

      if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
    };
  }, [
    preferences.isLiveUpdatesEnabled,
    liveUpdates,
    requestRefresh,
    isLiveUpdatesPaused,
  ]);

  const selectionEnabled = Boolean(
    uiState.isEditingMode && editing?.deleteRows,
  );

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
          disabled={uiState.isMutating || uiState.isApplyingChanges}
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
          disabled={uiState.isMutating || uiState.isApplyingChanges}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
        />
      ),
    };

    return [selectionColumn, ...columns];
  }, [
    columns,
    selectionEnabled,
    uiState.isMutating,
    uiState.isApplyingChanges,
  ]);

  const selectedRowsIds = Object.entries(uiState.rowSelection)
    .filter(([, selected]) => selected)
    .map(([rowId]) => rowId);

  const hasFilterFields = Object.keys(filterFields).length > 0;

  const getEditableValue = (row: TData, fieldId: string): EditableValue => {
    return (row as Record<string, EditableValue>)[fieldId];
  };

  const handleDraftChange = useCallback(
    ({ rowId, fieldId, value }: DraftCellChange) => {
      const originalRow = data.find((row) => getRowId?.(row) === rowId);

      if (!originalRow) return;

      const originalValue = getEditableValue(originalRow, fieldId);

      updateUiState("pendingChanges", (previous) => {
        const previousRowChanges = previous[rowId] ?? {};

        const nextChanges = { ...previous };

        if (Object.is(value, originalValue)) {
          const nextRowChanges = { ...previousRowChanges };

          delete nextRowChanges[fieldId];

          if (Object.keys(nextRowChanges).length === 0) {
            delete nextChanges[rowId];
          } else {
            nextChanges[rowId] = nextRowChanges;
          }

          return nextChanges;
        }

        nextChanges[rowId] = { ...previousRowChanges, [fieldId]: value };

        return nextChanges;
      });
    },
    [data, getRowId, updateUiState],
  );

  const displayedData = useMemo(() => {
    if (
      !editing ||
      !getRowId ||
      Object.keys(uiState.pendingChanges).length === 0
    )
      return data;

    return data.map((row) => {
      const rowId = getRowId(row);

      const rowChanges = uiState.pendingChanges[rowId];

      if (!rowChanges) return row;

      return { ...row, ...rowChanges } as TData;
    });
  }, [data, editing, getRowId, uiState.pendingChanges]);

  const handleResetChanges = useCallback(
    () => updateUiState("pendingChanges", {}),
    [updateUiState],
  );

  const handleApplyChanges = useCallback(async () => {
    if (!editing?.updateRow || !getRowId) return;

    const entries = Object.entries(uiState.pendingChanges);

    if (entries.length === 0) return;

    const controller = new AbortController();

    updateUiState("isApplyingChanges", true);

    try {
      const results = await Promise.allSettled(
        entries.map(([rowId, changes]) =>
          editing.updateRow!({ rowId, changes, signal: controller.signal }),
        ),
      );

      const updatedRows = new Map<string, TData>();
      const failedChanges: PendingChanges = {};
      const errorMessages: string[] = [];

      results.forEach((result, index) => {
        const [rowId, changes] = entries[index];

        if (result.status === "fulfilled") {
          updatedRows.set(rowId, result.value);
          return;
        }

        failedChanges[rowId] = changes;

        errorMessages.push(
          result.reason instanceof Error
            ? result.reason.message
            : `Failed to update row ${rowId}`,
        );
      });

      setData((previousRows) =>
        previousRows.map((row) => {
          const rowId = getRowId(row);

          return updatedRows.get(rowId) ?? row;
        }),
      );

      updateUiState("pendingChanges", failedChanges);

      if (updatedRows.size > 0) {
        toaster.create({
          title: `Updated rows: ${updatedRows.size}`,
          type: "success",
          duration: 3000,
        });
      }

      if (errorMessages.length > 0) {
        toaster.create({
          title: "Some rows could not be updated",
          description: errorMessages.join("; "),
          type: "error",
          duration: 6000,
        });
      }
    } finally {
      updateUiState("isApplyingChanges", false);
    }
  }, [editing, getRowId, uiState.pendingChanges, updateUiState]);

  const changedCellsCount = Object.values(uiState.pendingChanges).reduce(
    (count, changes) => count + Object.keys(changes).length,
    0,
  );

  const table = useReactTable<TData>({
    data: displayedData,
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
      rowSelection: uiState.rowSelection,
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
    rowCount: uiState.totalCount,
    enableColumnResizing: true,
    enableRowSelection: selectionEnabled
      ? (row) => editing?.canDeleteRow?.(row.original) !== false
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

    onRowSelectionChange: (updater) =>
      updateUiState(
        "rowSelection",
        functionalUpdate(updater, uiState.rowSelection),
      ),

    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    enableMultiSort: false,
  });

  const hasPendingChanges = changedCellsCount > 0;

  const handleStartEditing = useCallback(() => {
    updateUiState("rowSelection", {});
    updateUiState("isFilterBlockOpen", false);
    updateUiState("isEditingMode", true);
  }, [updateUiState]);

  const handleExitEditing = useCallback(() => {
    if (hasPendingChanges) {
      toaster.create({
        title: " Сначала примените или отмените изменения",
        type: "warning",
        duration: 4000,
      });

      return;
    }

    updateUiState("rowSelection", {});
    updateUiState("isEditingMode", false);
  }, [hasPendingChanges, updateUiState]);

  const toolbarMode: ToolbarMode = uiState.isEditingMode
    ? "editing"
    : "default";

  const editingLeft = (
    <HStack gap={2}>
      <LuPencil />

      <Text fontWeight="medium">Режим редактирования</Text>

      {hasPendingChanges && (
        <Badge colorPalette="yellow">{changedCellsCount}</Badge>
      )}
    </HStack>
  );

  const defaultLeft = (
    <GlobalSearch value={uiState.globalSearch} onSubmit={handleSearchSubmit} />
  );

  const editingRight = (
    <HStack gap={2} flexWrap="wrap" justifyContent="flex-end">
      {editing?.deleteRows && selectedRowsIds.length > 0 && (
        <DeleteSelectedRowsButton
          disabled={uiState.isMutating || uiState.isApplyingChanges}
          onClick={() => setIsDeleteDialogOpen(true)}
        />
      )}

      <ResetAllChangesButton
        isApplying={uiState.isApplyingChanges}
        disabled={!hasPendingChanges}
        onClick={handleResetChanges}
      />

      <ApplyAllChangesButton
        isApplying={uiState.isApplyingChanges}
        changesCount={changedCellsCount}
        disabled={!hasPendingChanges}
        onClick={() => void handleApplyChanges()}
      />

      <Button
        aria-label="Завершить"
        size="sm"
        variant="outline"
        width={{ base: "36px", md: "132px" }}
        minWidth={{ base: "36px", md: "132px" }}
        paddingInline={{ base: 0, md: 3 }}
        onClick={handleExitEditing}
      >
        <LuLogOut />
        <Text hideBelow="md">Завершить</Text>
      </Button>
    </HStack>
  );

  const defaultRight = (
    <HStack gap={2} flexWrap="wrap" justifyContent="flex-end">
      {editing?.updateRow && (
        <EditingModeButton
          isEditingMode={uiState.isEditingMode}
          onClick={
            uiState.isEditingMode ? handleExitEditing : handleStartEditing
          }
        />
      )}

      <RefreshButton
        onRefresh={requestRefresh}
        isRefreshing={uiState.isRefreshing}
      />

      {hasFilterFields && (
        <FilterButton
          isOpen={uiState.isFilterBlockOpen}
          activeFiltersCount={uiState.displayedFilters.length}
          onToggle={() =>
            updateUiState("isFilterBlockOpen", !uiState.isFilterBlockOpen)
          }
        />
      )}

      <TableSettings
        table={table}
        columns={preferences.columnOrder}
        isLiveUpdatesEnabled={preferences.isLiveUpdatesEnabled}
        onColumnOrderChange={(newOrder) =>
          updatePreferences("columnOrder", newOrder)
        }
        onLiveUpdatesEnabledChange={(enabled) =>
          updatePreferences("isLiveUpdatesEnabled", enabled)
        }
      />
    </HStack>
  );

  const toolbarLeft = toolbarMode === "editing" ? editingLeft : defaultLeft;

  const toolbarRight = toolbarMode === "editing" ? editingRight : defaultRight;

  return (
    <Stack width="full" height="full" minHeight={0} gap={5} overflow="hidden">
      <TableToolbar left={toolbarLeft} right={toolbarRight} />

      {/* Панель фильтрации */}
      {hasFilterFields && uiState.isFilterBlockOpen && (
        <Box flexShrink={0}>
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
        </Box>
      )}

      <TableView
        table={table}
        showSkeleton={uiState.showSkeleton}
        pageSize={preferences.pageSize}
        editableFields={editing?.updateRow ? editing.fields : undefined}
        pendingChanges={uiState.pendingChanges}
        isApplyingChanges={uiState.isApplyingChanges}
        onDraftChange={editing?.updateRow ? handleDraftChange : undefined}
        isEditingMode={uiState.isEditingMode}
        isSelectionDisabled={uiState.isMutating || uiState.isApplyingChanges}
      />

      {/* Пагинация */}
      {uiState.totalCount > 0 && (
        <Box flexShrink={0}>
          <TablePagination
            pageIndex={uiState.pageIndex}
            pageSize={preferences.pageSize}
            totalCount={uiState.totalCount}
            pageSizeOptions={page_size_options}
            onPageChange={(newPage: number) => {
              table.setPageIndex(newPage - 1);
            }}
            onPageSizeChange={(newSize) => table.setPageSize(newSize)}
            liveUpdateStatus={uiState.liveUpdateStatus}
            disabled={uiState.isEditingMode}
          />
        </Box>
      )}

      <DeleteRowsDialog
        open={isDeleteDialogOpen}
        rowsCount={selectedRowsIds.length}
        isDeleting={uiState.isMutating}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={async () => {
          const wasDeleted = await handleDeleteRows(selectedRowsIds);

          if (wasDeleted) setIsDeleteDialogOpen(false);
        }}
      />
    </Stack>
  );
};

export default DataTable;
