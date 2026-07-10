import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  Box,
  Flex,
  Text,
  Spinner,
  Center,
  HStack,
  Heading,
  Pagination,
  Icon,
  NativeSelect,
  Input,
  ButtonGroup,
} from "@chakra-ui/react";
import {
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

export interface StaticFilterOption {
  label: string;
  value: string | number;
}

export interface DynamicFilterConfig {
  key: string;
  label: string;
  options?: StaticFilterOption[]; // 1. Changed to optional (?) to accept open-ended lookups
}

interface GenericDataTableProps<TData> {
  title: string;
  columns: ColumnDef<TData>[];
  predefinedFilters?: DynamicFilterConfig[];
  onFetchData: (params: {
    page: number;
    size: number;
    ordering: string;
    filters: Record<string, string>;
  }) => Promise<{ results: TData[]; count: number }>;
}

export function GenericDataTable<TData>({
  title,
  columns,
  predefinedFilters = [],
  onFetchData,
}: GenericDataTableProps<TData>) {
  const [data, setData] = useState<TData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {},
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const paginationState = useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize],
  );

  // Sync Fetch Effect
  useEffect(() => {
    const handleSyncFetch = async () => {
      try {
        setLoading(true);

        let orderingParam = "";
        if (sorting.length > 0) {
          const activeColumn = sorting[0];
          orderingParam = `${activeColumn.desc ? "-" : ""}${activeColumn.id}`;
        }

        const sanitizedFilters = Object.fromEntries(
          Object.entries(activeFilters).filter(([_, value]) => value !== ""),
        );

        const response = await onFetchData({
          page: pageIndex + 1,
          size: pageSize,
          ordering: orderingParam,
          filters: sanitizedFilters,
        });

        setData(response.results);
        setTotalCount(response.count);
      } catch (error) {
        console.error("Data tracking failure:", error);
      } finally {
        setLoading(false);
      }
    };

    handleSyncFetch();
  }, [pageIndex, pageSize, sorting, activeFilters, onFetchData]);

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(totalCount / pageSize),
    state: { pagination: paginationState, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const handleFilterUpdate = (key: string, val: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: val }));
    table.setPageIndex(0);
  };

  return (
    <Box spaceY={4} w="full" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
        <Heading size="lg">{title}</Heading>

        {/* 2. Dynamic Filter Input Controller Layout Grid */}
        {predefinedFilters.length > 0 && (
          <HStack gap={3} wrap="wrap">
            {predefinedFilters.map((filter) => {
              // If options are provided, render a dropdown
              if (filter.options) {
                return (
                  <NativeSelect.Root key={filter.key} size="sm" maxW="180px">
                    <NativeSelect.Field
                      placeholder={`All ${filter.label}s`}
                      value={activeFilters[filter.key] || ""}
                      onChange={(e) =>
                        handleFilterUpdate(filter.key, e.target.value)
                      }
                      bg="bg.panel"
                    >
                      {filter.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                );
              }

              // 3. FALLBACK: If options are missing, render an open text search box instead
              return (
                <Input
                  key={filter.key}
                  size="sm"
                  maxW="180px"
                  placeholder={`Search ${filter.label}...`}
                  value={activeFilters[filter.key] || ""}
                  onChange={(e) =>
                    handleFilterUpdate(filter.key, e.target.value)
                  }
                  bg="bg.panel"
                />
              );
            })}
          </HStack>
        )}
      </Flex>

      {/* Main Grid Render Blocks */}
      {loading ? (
        <Center py={20}>
          <Spinner size="xl" />
        </Center>
      ) : (
        <>
          <Box
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="xl"
            overflow="hidden"
            bg="bg.panel"
          >
            <Table.Root variant="line" interactive>
              <Table.Header>
                {table.getHeaderGroups().map((hg) => (
                  <Table.Row key={hg.id} bg="bg.muted">
                    {hg.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const direction = header.column.getIsSorted();

                      return (
                        <Table.ColumnHeader
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          cursor={canSort ? "pointer" : "default"}
                          userSelect="none"
                          py={4}
                        >
                          <HStack gap={2}>
                            <Text fontWeight="bold">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </Text>
                            {canSort && (
                              <Box color="fg.muted">
                                {direction === "asc" && <FiChevronUp />}
                                {direction === "desc" && <FiChevronDown />}
                                {!direction && <Box w={4} h={4} />}
                              </Box>
                            )}
                          </HStack>
                        </Table.ColumnHeader>
                      );
                    })}
                  </Table.Row>
                ))}
              </Table.Header>
              <Table.Body>
                {table.getRowModel().rows.length === 0 ? (
                  <Table.Row>
                    <Table.Cell
                      colSpan={columns.length}
                      textAlign="center"
                      py={12}
                      color="fg.muted"
                    >
                      No records match the active criteria parameters.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <Table.Row key={row.id} _hover={{ bg: "bg.muted/50" }}>
                      {row.getVisibleCells().map((cell) => (
                        <Table.Cell key={cell.id} py={3.5}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Box>

          <Flex
            justifyContent="space-between"
            alignItems="center"
            px={2}
            wrap="wrap"
            gap={4}
          >
            <Text fontSize="sm" color="fg.muted">
              Displaying records {pageIndex * pageSize + 1} to{" "}
              {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount}{" "}
              total entries
            </Text>

            <Pagination.Root
              count={totalCount}
              pageSize={pageSize}
              page={pageIndex + 1}
              onPageChange={(details) => table.setPageIndex(details.page - 1)}
            >
              <ButtonGroup attached variant="outline" size="sm">
                <Pagination.PrevTrigger>
                  <Icon asChild>
                    <FiChevronLeft />
                  </Icon>
                </Pagination.PrevTrigger>
                <Pagination.Context>
                  {({ pages }) =>
                    pages.map((page, i) =>
                      page.type === "page" ? (
                        <Pagination.Item key={i} {...page} />
                      ) : (
                        <Pagination.Ellipsis key={i} index={i} />
                      ),
                    )
                  }
                </Pagination.Context>
                <Pagination.NextTrigger>
                  <Icon asChild>
                    <FiChevronRight />
                  </Icon>
                </Pagination.NextTrigger>
              </ButtonGroup>
            </Pagination.Root>
          </Flex>
        </>
      )}
    </Box>
  );
}
