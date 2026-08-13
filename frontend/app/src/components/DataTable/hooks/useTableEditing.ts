import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type {
  PendingChanges,
  DataTableEditingConfig,
  DraftCellChange,
  EditableValue,
} from "../types";
import {
  functionalUpdate,
  type RowSelectionState,
  type Updater,
} from "@tanstack/react-table";
import { toaster } from "../../ui/toaster";

interface UseTableEditingProps<TData> {
  rows: TData[];
  setRows: Dispatch<SetStateAction<TData[]>>;
  editing?: DataTableEditingConfig<TData>;
  getRowId?: (row: TData) => string;
  pageIndex: number;
  onPageIndexChange: (pageIndex: number) => void;
  refresh: () => void;
}

const getEditableValue = <TData>(
  row: TData,
  fieldId: string,
): EditableValue => {
  return (row as Record<string, EditableValue>)[fieldId];
};

const useTableEditing = <TData>({
  rows,
  setRows,
  editing,
  getRowId,
  pageIndex,
  onPageIndexChange,
  refresh,
}: UseTableEditingProps<TData>) => {
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectionEnabled = Boolean(isEditingMode && editing?.deleteRows);
  const selectedRowIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([rowId]) => rowId),
    [rowSelection],
  );

  const handleRowSelectionChange = useCallback(
    (updater: Updater<RowSelectionState>) =>
      setRowSelection((prev) => functionalUpdate(updater, prev)),
    [],
  );

  const canDeleteRow = useCallback(
    (row: TData) => editing?.canDeleteRow?.(row) !== false,
    [editing],
  );

  const handleDraftChange = useCallback(
    ({ rowId, fieldId, value }: DraftCellChange) => {
      const originalRow = rows.find((row) => getRowId?.(row) === rowId);

      if (!originalRow) return;

      const originalValue = getEditableValue(originalRow, fieldId);

      setPendingChanges((prev) => {
        const previousRowChanges = prev[rowId] ?? {};
        const nextChanges = { ...prev };

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
    [rows, getRowId],
  );

  const rowsWithPendingChanges = useMemo(() => {
    if (!getRowId || Object.keys(pendingChanges).length === 0) return rows;

    return rows.map((row) => {
      const rowId = getRowId(row);
      const rowChanges = pendingChanges[rowId];

      if (!rowChanges) return row;

      return { ...row, ...rowChanges } as TData;
    });
  }, [rows, getRowId, pendingChanges]);

  const handleResetChanges = useCallback(() => setPendingChanges({}), []);

  const handleApplyChanges = useCallback(async () => {
    if (!editing?.updateRow || !getRowId) return;

    const entries = Object.entries(pendingChanges);

    if (entries.length == 0) return;

    const controller = new AbortController();

    setIsApplyingChanges(true);

    try {
      const results = await Promise.allSettled(
        entries.map(([rowId, changes]) =>
          editing.updateRow!({ rowId, changes, signal: controller.signal }),
        ),
      );

      const updateRows = new Map<string, TData>();
      const failedChanges: PendingChanges = {};
      const errorMessages: string[] = [];

      results.forEach((result, index) => {
        const [rowId, changes] = entries[index];

        if (result.status === "fulfilled") {
          updateRows.set(rowId, result.value);
          return;
        }

        failedChanges[rowId] = changes;

        errorMessages.push(
          result.reason instanceof Error
            ? result.reason.message
            : `Failed to update row ${rowId}`,
        );
      });

      setRows((previousRows) =>
        previousRows.map((row) => {
          const rowId = getRowId(row);

          return updateRows.get(rowId) ?? row;
        }),
      );

      setPendingChanges(failedChanges);

      if (updateRows.size > 0)
        toaster.create({
          title: `Обновлено строк: ${updateRows.size}`,
          type: "success",
          duration: 3000,
        });

      if (errorMessages.length > 0)
        toaster.create({
          title: `Не удалось обновить записей: ${errorMessages.length}`,
          description: errorMessages.join("; "),
          type: "error",
          duration: 6000,
        });
    } finally {
      setIsApplyingChanges(false);
    }
  }, [editing, getRowId, pendingChanges, setRows]);

  const handleDeleteRows = useCallback(
    async (rowIds: string[]): Promise<boolean> => {
      if (!editing?.deleteRows || rowIds.length === 0) return false;

      const controller = new AbortController();

      setIsDeleting(true);

      try {
        await editing.deleteRows({ rowIds, signal: controller.signal });

        setRowSelection({});

        setPendingChanges((prev) => {
          const next = { ...prev };

          rowIds.forEach((rowId) => delete next[rowId]);

          return next;
        });

        const remainingRows = rows.filter((row) => {
          const rowId = getRowId?.(row);
          return rowId === undefined || !rowIds.includes(rowId);
        });

        if (remainingRows.length === 0 && pageIndex > 0) {
          onPageIndexChange(pageIndex - 1);
        } else {
          refresh();
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
        setIsDeleting(false);
      }
    },
    [editing, rows, getRowId, pageIndex, onPageIndexChange, refresh],
  );

  const changedCellsCount = useMemo(
    () =>
      Object.values(pendingChanges).reduce(
        (count, changes) => count + Object.keys(changes).length,
        0,
      ),
    [pendingChanges],
  );

  const hasPendingChanges = changedCellsCount > 0;

  const startEditing = useCallback(() => {
    setRowSelection({});
    setIsEditingMode(true);
  }, []);

  const exitEditing = useCallback(() => {
    if (hasPendingChanges) {
      toaster.create({
        title: "Сначала примените или отмените изменения",
        type: "warning",
        duration: 4000,
      });

      return false;
    }

    setRowSelection({});
    setIsEditingMode(false);

    refresh();

    return true;
  }, [hasPendingChanges, refresh]);

  return {
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
  };
};

export default useTableEditing;
