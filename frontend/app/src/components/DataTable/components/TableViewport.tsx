import { Box, Button, Skeleton, Table, Text } from "@chakra-ui/react";
import type {
  DraftCellChange,
  EditableFieldRegistry,
  EditableValue,
  PendingChanges,
} from "../types";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import { getPinnedColumnStyles } from "../utils/getPinnedColumnStyles";
import EditableCell from "./EditableCell";
import { SELECT_COLUMN_ID } from "../constants";

interface TableViewportProps<TData> {
  table: TanstackTable<TData>;
  showSkeleton: boolean;
  pageSize: number;

  editableFields?: EditableFieldRegistry;
  filteredColumnIds?: ReadonlySet<string>;

  pendingChanges?: PendingChanges;

  onDraftChange?: (change: DraftCellChange) => void;

  isEditingMode: boolean;
  isSelectionDisabled?: boolean;
}

const TableViewport = <TData,>({
  table,
  showSkeleton,
  pageSize,
  editableFields,
  filteredColumnIds,
  pendingChanges = {},
  isSelectionDisabled = false,
  isEditingMode,
  onDraftChange,
}: TableViewportProps<TData>) => {
  return (
    <Table.ScrollArea
      borderWidth="1px"
      rounded="md"
      width="fit-content"
      maxWidth="full"
      alignSelf="flex-start"
      flex="0 1 auto"
      overflowX="auto"
      overflowY="auto"
      overscrollBehavior="contain"
    >
      <Table.Root
        variant="outline"
        showColumnBorder
        interactive
        tableLayout="fixed"
        style={{
          width: table.getTotalSize(),
          borderCollapse: "separate",
          borderSpacing: 0,
        }}
      >
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortDirection = header.column.getIsSorted();
                const isEditableColumn = Boolean(
                  editableFields?.[header.column.id],
                );
                const isFilteredColumn =
                  filteredColumnIds?.has(header.column.id) ?? false;

                return (
                  <Table.ColumnHeader
                    key={header.id}
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    bg={
                      isEditingMode && isEditableColumn
                        ? "orange.subtle"
                        : !isEditingMode && isFilteredColumn
                          ? "blue.subtle"
                          : "bg.muted"
                    }
                    style={{
                      width: header.getSize(),
                      minWidth: header.getSize(),
                      maxWidth: header.getSize(),

                      ...getPinnedColumnStyles(header.column, {
                        isHeader: true,
                        showBoundaryShadow:
                          header.column.id !== SELECT_COLUMN_ID,
                      }),
                    }}
                    title={
                      isEditableColumn ? "Редактируемый столбец" : undefined
                    }
                    borderBottomWidth={
                      isEditingMode && isEditableColumn ? "4px" : "1px"
                    }
                    borderBottomColor={
                      isEditingMode && isEditableColumn
                        ? "orange.solid"
                        : "border.muted"
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        width="full"
                        height="full"
                        justifyContent="flex-start"
                        px={0}
                        pe="8px"
                        overflow="hidden"
                        borderRadius={0}
                        onClick={
                          isEditingMode
                            ? undefined
                            : header.column.getToggleSortingHandler()
                        }
                        cursor={
                          isEditingMode
                            ? "default"
                            : header.column.getCanSort()
                              ? "pointer"
                              : "default"
                        }
                        disabled={isEditingMode}
                      >
                        <Box
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </Box>
                        {sortDirection === "asc" && (
                          <Text as="span" fontSize="xs" flexShrink={0}>
                            ▲
                          </Text>
                        )}
                        {sortDirection === "desc" && (
                          <Text as="span" fontSize="xs" flexShrink={0}>
                            ▼
                          </Text>
                        )}
                      </Button>
                    )}

                    {header.column.getCanResize() && (
                      <Box
                        role="separator"
                        aria-orientation="vertical"
                        position="absolute"
                        top={0}
                        right={0}
                        width="6px"
                        height="full"
                        cursor="col-resize"
                        userSelect="none"
                        touchAction="none"
                        zIndex={2}
                        bg={
                          header.column.getIsResizing()
                            ? "blue.400"
                            : "transparent"
                        }
                        _hover={{
                          bg: "blue.300",
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          header.column.resetSize();
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          header.getResizeHandler()(e);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          header.getResizeHandler()(e);
                        }}
                      />
                    )}
                  </Table.ColumnHeader>
                );
              })}
            </Table.Row>
          ))}
        </Table.Header>

        <Table.Body>
          {showSkeleton ? (
            // 1. RENDER SKELETON PLACEHOLDERS DURING FETCH PASSES
            // Generates a mock array matching your active page size (e.g. 10 rows)
            Array.from({ length: pageSize }).map((_, rowIndex) => (
              <Table.Row key={`skeleton-row-${rowIndex}`}>
                {table.getVisibleLeafColumns().map((column) => (
                  <Table.Cell
                    key={`skeleton-cell-${rowIndex}-${column.id}`}
                    borderBottomWidth="1px"
                    borderBottomColor="border.muted"
                    bg={column.getIsPinned() ? "bg.panel" : undefined}
                    style={{
                      width: column.getSize(),
                      minWidth: column.getSize(),
                      maxWidth: column.getSize(),

                      ...getPinnedColumnStyles(column, {
                        showBoundaryShadow: column.id !== SELECT_COLUMN_ID,
                      }),
                    }}
                  >
                    {/* Chakra UI v3 Skeleton line animation */}
                    <Skeleton height="20px" width="full" rounded="sm" />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            // 2. RENDER EMPTY STATE IF ZERO DATA RECORDS MATCH THE QUERIES
            <Table.Row>
              <Table.Cell
                colSpan={table.getVisibleLeafColumns().length}
                textAlign="center"
                py={10}
                borderBottomWidth="1px"
                borderBottomColor="border.muted"
              >
                <Text color="fg.muted">
                  Записи не найдены по заданным условиям поиска
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            // 3. RENDER REAL DATA ROWS NATIVELY
            table.getRowModel().rows.map((row) => (
              <Table.Row key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const editableDefinition = editableFields?.[cell.column.id];
                  const rowChanges = pendingChanges[row.id];

                  const isDirty = Object.prototype.hasOwnProperty.call(
                    rowChanges ?? {},
                    cell.column.id,
                  );

                  const displayContent = flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  );

                  const isSelectionCell = cell.column.id === SELECT_COLUMN_ID;

                  const canToggleSelection =
                    isSelectionCell &&
                    row.getCanSelect() &&
                    !isSelectionDisabled;

                  return (
                    <Table.Cell
                      key={cell.id}
                      verticalAlign={isSelectionCell ? "middle" : "top"}
                      textAlign={isSelectionCell ? "center" : "start"}
                      padding={isSelectionCell ? 0 : undefined}
                      cursor={canToggleSelection ? "pointer" : undefined}
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      borderBottomWidth="1px"
                      borderBottomColor="border.muted"
                      bg={
                        isDirty
                          ? "orange.muted"
                          : cell.column.getIsPinned()
                            ? "bg.panel"
                            : undefined
                      }
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),

                        ...getPinnedColumnStyles(cell.column, {
                          showBoundaryShadow:
                            cell.column.id !== SELECT_COLUMN_ID,
                        }),
                      }}
                      onClick={
                        canToggleSelection
                          ? () => row.toggleSelected()
                          : undefined
                      }
                      _hover={
                        canToggleSelection
                          ? {
                              bg: row.getIsSelected()
                                ? "blue.subtle"
                                : "bg.muted",
                            }
                          : undefined
                      }
                    >
                      {editableDefinition && onDraftChange ? (
                        <EditableCell
                          definition={editableDefinition}
                          value={cell.getValue() as EditableValue}
                          displayContent={displayContent}
                          onChange={(value) =>
                            onDraftChange({
                              rowId: row.id,
                              fieldId: cell.column.id,
                              value,
                            })
                          }
                          isEditingMode={isEditingMode}
                        />
                      ) : (
                        displayContent
                      )}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
};

export default TableViewport;
