import { Box, HStack, Skeleton, Table, Text } from "@chakra-ui/react";
import type { TableViewProps } from "../types";
import { flexRender } from "@tanstack/react-table";

const DataTable = <TData,>({
  table,
  showSkeleton,
  pageSize,
}: TableViewProps<TData>) => {
  return (
    <Table.ScrollArea borderWidth="1px" maxW="1200px" rounded="md" width="full">
      <Table.Root variant="outline" showColumnBorder stickyHeader interactive>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isSortable = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();

                return (
                  <Table.ColumnHeader
                    key={header.id}
                    position="relative"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    cursor={isSortable ? "pointer" : "default"}
                    onClick={
                      isSortable
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    _hover={isSortable ? { bg: "bg.muted/50" } : {}}
                  >
                    {header.isPlaceholder ? null : (
                      <HStack gap={1} display="inline-flex">
                        <Box>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </Box>
                        {sortDirection === "asc" && (
                          <Text as="span" fontSize="xs">
                            ▲
                          </Text>
                        )}
                        {sortDirection === "desc" && (
                          <Text as="span" fontSize="xs">
                            ▼
                          </Text>
                        )}
                      </HStack>
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
                  <Table.Cell key={`skeleton-cell-${rowIndex}-${column.id}`}>
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
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell
                    key={cell.id}
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
};

export default DataTable;
