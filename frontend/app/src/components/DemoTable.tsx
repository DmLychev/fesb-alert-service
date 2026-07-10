import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  CloseButton,
  createListCollection,
  Flex,
  Group,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Menu,
  Pagination,
  Portal,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  Popover,
} from "@chakra-ui/react";
import {
  type ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import api from "../api";
import { toaster } from "./ui/toaster";
import { CiViewColumn } from "react-icons/ci";
import { SortableColumnItem } from "./DataTable/SortableColumnItem";
// 1. Core Drag and Drop Context and Event Types
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";

// 2. Sortable Context Providers and Strategies
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

// 3. Modifiers to keep the dragging item bounded inside the container popover
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";

type DateTimeString = string;

interface Route {
  id: string;
  name: string;
  domainName: string;
}

interface Message {
  route: Route;
  exchangeId: string;
  requestId: string;
  errorMessage: string | null;
  updateStatusAttempts: number;
  status: "SUCCESS" | "ERROR" | null;
  startDate: DateTimeString;
  endDate?: DateTimeString | null;
  warningLevel?: number | null;
}

type ColumnType = "string" | "number" | "boolean" | "datetime" | "choice";

interface ColumnMetadata {
  label: string;
  type: ColumnType;
  nullable?: boolean;
  choices?: { value: string; label: string }[];
  renderCell?: (value: any) => React.ReactNode;
}

// A local unique ID structure for UI rendering rows
interface UiFilterRow {
  id: string; // unique string or timestamp
  column: string;
  operation: string;
  value: string;
}

export interface TableViewState {
  version: number; // Useful for future updates
  filters: UiFilterRow[];
  sorting: { id: string; desc: boolean }[];
  columnVisibility: Record<string, boolean>;
  columnOrder: string[];
  pageSize: number;
}

const pageSizeOptions = createListCollection({
  items: [
    { value: "10", label: "10 строк" },
    { value: "25", label: "25 строк" },
    { value: "50", label: "50 строк" },
    { value: "100", label: "100 строк" },
  ],
});

const STORAGE_KEY = "table_view_settings_v1";

const DEFAULT_STATE: TableViewState = {
  version: 1,
  filters: [],
  sorting: [],
  columnVisibility: {},
  columnOrder: [],
  pageSize: 10,
};

export const useTableViewSettings = (tableId: string) => {
  const key = `${STORAGE_KEY}_${tableId}`; // Unique per table if you have multiple

  // Initialize state directly from localStorage if it exists
  const [viewState, setViewState] = useState<TableViewState>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  // Sync to local storage whenever the state updates
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(viewState));
  }, [viewState, key]);

  // Helper functions to update individual slices cleanly
  const updateFilters = (filters: UiFilterRow[]) => {
    setViewState((prev) => ({ ...prev, filters }));
  };

  const updateSorting = (sorting: TableViewState["sorting"]) => {
    setViewState((prev) => ({ ...prev, sorting }));
  };

  const updateVisibility = (
    columnVisibility: TableViewState["columnVisibility"],
  ) => {
    setViewState((prev) => ({ ...prev, columnVisibility }));
  };

  const updateOrder = (columnOrder: string[]) => {
    setViewState((prev) => ({ ...prev, columnOrder }));
  };

  const resetToDefault = () => {
    setViewState(DEFAULT_STATE);
  };

  return {
    viewState,
    updateFilters,
    updateSorting,
    updateVisibility,
    updateOrder,
    resetToDefault,
  };
};

const FIELD_REGISTRY: Record<string, ColumnMetadata> = {
  "route.domainName": { label: "Домен", type: "string" },
  "route.name": { label: "СОПС", type: "string" },
  status: {
    label: "Статус",
    type: "choice",
    nullable: true,
    choices: [
      { value: "SUCCESS", label: "SUCCESS" },
      { value: "ERROR", label: "ERROR" },
    ],
    renderCell: (status) => {
      if (!status) return "";
      const isError = status === "ERROR";
      return <Badge colorPalette={isError ? "red" : "green"}>{status}</Badge>;
    },
  },
  startDate: {
    label: "Начало обработки",
    type: "datetime",
    renderCell: (rawValue) => {
      if (!rawValue) return "";
      const date = new Date(rawValue);
      const pad = (num: number, size = 2) => String(num).padStart(size, "0");
      return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
    },
  },
  errorMessage: { label: "Текст ошибки", type: "string" },
  updateStatusAttempts: { label: "Попыток", type: "number" },
  exchangeId: { label: "Exchange ID", type: "string" },
  requestId: { label: "Request ID", type: "string" },
};

const FILTERABLE_COLUMNS_COLLECTION = createListCollection({
  items: Object.entries(FIELD_REGISTRY).map(([key, meta]) => ({
    value: key,
    label: meta.label,
  })),
});

const ALL_OPERATIONS_ITEMS = [
  { value: "exact", label: "Равно (=)" },
  { value: "contains", label: "Содержит (Частично)" },
  { value: "gt", label: "Больше (>)" },
  { value: "gte", label: "Больше или равно (>=)" },
  { value: "lt", label: "Меньше (<)" },
  { value: "lte", label: "Меньше или равно (<=)" },
  { value: "isnull", label: "Пусто (NULL)" },
  { value: "notnull", label: "Не пусто (NOT NULL)" },
];

const BOOL_VALUES_COLLECTION = createListCollection({
  items: [
    { value: "true", label: "Да (True)" },
    { value: "false", label: "Нет (False)" },
  ],
});

const format_date = (iso_datetime?: string) => {
  if (!iso_datetime) return "";

  const date = new Date(iso_datetime);

  const pad = (num: number, size = 2) => String(num).padStart(size, "0");

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}.${ms}`;
};

const getBeginningOfCurrentDayString = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());

  return `${year}-${month}-${day}T00:00`;
};

const columnHelper = createColumnHelper<Message>();

const columns = Object.entries(FIELD_REGISTRY).map(([columnKey, meta]) => {
  const safeId = columnKey.replace(/\./g, "_");

  return columnHelper.accessor(columnKey as any, {
    id: safeId,
    header: meta.label,
    cell: (info) => {
      const rawValue = info.getValue();
      return meta.renderCell ? meta.renderCell(rawValue) : rawValue;
    },
  });
});

const Demo = () => {
  const [data, setData] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Запомнить названия столбцов
  const tableColumns = useMemo(() => columns, []);
  // Столбцы, для которых активна сортировка
  const [sorting, setSorting] = useState<SortingState>(() => {
    const savedSorting = localStorage.getItem("message_table_sorting");
    return savedSorting ? JSON.parse(savedSorting) : [];
  });
  // Текстовое значение строки глобального поиска
  const [globalFilter, setGlobalFilter] = useState("");
  const [globalFilterInput, setGlobalFilterInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Значения фильтров по столбцам
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // Отображаем столбцы
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const savedVisibility = localStorage.getItem(
        "message_table_column_visibility",
      );
      return savedVisibility ? JSON.parse(savedVisibility) : {};
    },
  );
  // Порядок следования столбцов
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const savedOrder = localStorage.getItem("message_table_column_order");
    if (savedOrder) return JSON.parse(savedOrder);

    return Object.keys(FIELD_REGISTRY).map((key) => key.replace(/\./g, "_"));
  });

  // Пагинация
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: Number(pageSizeOptions.items[0].value),
  });
  const paginationState = useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize],
  );
  const handlePageSizeChange = (newSize: number) => {
    setPagination({
      pageIndex: 0,
      pageSize: newSize,
    });
  };
  // Количество строк для вывода в таблицу
  const [totalCount, setTotalCount] = useState<number>(0);
  // Состояние панели фильтрации
  const [isFilterBlockOpen, setIsFilterBlockOpen] = useState(false);
  // Действующие фильтры
  const [activeFilters, setActiveFilters] = useState<UiFilterRow[]>(() => {
    const savedLayout = localStorage.getItem("message_table_filters");
    return savedLayout ? JSON.parse(savedLayout) : [];
  });

  // Создать граф запроса к бэкенду
  const compileGraphQLFilters = (filtersList: UiFilterRow[]) => {
    if (filtersList.length === 0) return null;

    // We will collect root-level conditions here (handles implicit AND)
    const conditions: any[] = [];
    // Standard fields can still be grouped into a single base object
    const baseFilterObject: Record<string, any> = {};

    filtersList.forEach((row) => {
      if (!row.column || !row.operation) return;

      const columnMeta =
        FIELD_REGISTRY[row.column as keyof typeof FIELD_REGISTRY];
      const isStringColumn = !columnMeta || columnMeta.type === "string";

      // --- 1. Handle the new 'isnull' and 'notnull' logic for STRINGS ---
      if (
        isStringColumn &&
        (row.operation === "isnull" || row.operation === "notnull")
      ) {
        // Helper to build the nested object path (e.g., "parent.child" -> { parent: { child: ... } })
        const buildNestedObject = (path: string, leafValue: any) => {
          const parts = path.split(".");
          const result: Record<string, any> = {};
          let current = result;

          parts.forEach((part, index) => {
            if (index === parts.length - 1) {
              current[part] = leafValue;
            } else {
              current[part] = {};
              current = current[part];
            }
          });
          return result;
        };

        const nullCondition = buildNestedObject(row.column, { isNull: true });
        const emptyCondition = buildNestedObject(row.column, { exact: "" });

        if (row.operation === "isnull") {
          conditions.push({ OR: [nullCondition, emptyCondition] });
        } else {
          conditions.push({ NOT: [nullCondition, emptyCondition] });
        }
        return; // Skip the rest of the loop for this row
      }

      // --- 2. Fallback to your original type transformations ---
      let resolvedOperation = row.operation;
      let resolvedValue: any = row.value;

      if (row.operation === "isnull") {
        resolvedOperation = "isNull";
        resolvedValue = true;
      } else if (row.operation === "notnull") {
        resolvedOperation = "isNull";
        resolvedValue = false;
      } else if (columnMeta?.type === "number" && row.value !== "") {
        resolvedValue = parseInt(row.value, 10);
      } else if (columnMeta?.type === "datetime" && row.value) {
        resolvedValue = new Date(row.value).toISOString();
      } else if (columnMeta?.type === "boolean" && row.value) {
        resolvedValue = row.value === "true";
      }

      // --- 3. Process dot-notation nested parameters for standard fields ---
      if (row.column.includes(".")) {
        const [parent, child] = row.column.split(".");
        baseFilterObject[parent] = baseFilterObject[parent] || {};
        baseFilterObject[parent][child] = baseFilterObject[parent][child] || {};
        baseFilterObject[parent][child][resolvedOperation] = resolvedValue;
      } else {
        baseFilterObject[row.column] = baseFilterObject[row.column] || {};
        baseFilterObject[row.column][resolvedOperation] = resolvedValue;
      }
    });

    // --- 4. Combine everything into a single query object ---
    // If we only have standard fields, return the flat object to keep queries clean
    if (conditions.length === 0) {
      return Object.keys(baseFilterObject).length > 0 ? baseFilterObject : null;
    }

    // If we have OR/NOT blocks, merge them alongside standard fields using "AND"
    if (Object.keys(baseFilterObject).length > 0) {
      conditions.unshift(baseFilterObject);
    }

    return { AND: conditions };
  };

  // Действующие фильтры, отправляемые в запросе в бэкенду
  const [committedFilters, setCommittedFilters] = useState<any>(() => {
    const savedLayout = localStorage.getItem("message_table_filters");
    if (savedLayout) {
      const parsedLayout = JSON.parse(savedLayout);
      return compileGraphQLFilters(parsedLayout);
    }
    return null;
  });

  // Автоматически сохранять изменения видимости полей в локальное хранилище браузера
  useEffect(() => {
    localStorage.setItem(
      "message_table_column_visibility",
      JSON.stringify(columnVisibility),
    );
  }, [columnVisibility]);

  // Автоматически сохранять изменения в сортировке в локальное хранилище браузера
  useEffect(() => {
    localStorage.setItem("message_table_sorting", JSON.stringify(sorting));
  }, [sorting]);

  // Автоматически сохранять изменения в порядке столбцов в локальное хранилище браузера
  useEffect(() => {
    localStorage.setItem(
      "message_table_column_order",
      JSON.stringify(columnOrder),
    );
  }, [columnOrder]);

  // Добавление фильтра
  const addFilterRow = () => {
    setActiveFilters((prev) => [
      ...prev,
      { id: crypto.randomUUID(), column: "", operation: "exact", value: "" },
    ]);
  };

  const handleColumnChange = (
    rowId: string,
    selectedColumn: keyof typeof FIELD_REGISTRY,
  ) => {
    const columnMeta = FIELD_REGISTRY[selectedColumn];

    setActiveFilters((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        // Default operations and values based on the registry definition type
        let defaultOp = "exact";
        let defaultValue = columnMeta.type === "number" ? "0" : "";

        if (columnMeta.type === "choice") {
          defaultOp = "exact";
        } else if (columnMeta.type === "datetime") {
          defaultValue = getBeginningOfCurrentDayString();
        }

        return {
          ...row,
          column: selectedColumn,
          operation: defaultOp,
          value: defaultValue,
        };
      }),
    );
  };

  // Удаление фильтра
  const removeFilterRow = (id: string) => {
    setActiveFilters((prev) => prev.filter((row) => row.id !== id));
  };

  // Изменение фильтра
  const updateFilterRow = (id: string, updatedFields: Partial<UiFilterRow>) => {
    setActiveFilters((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...updatedFields } : row)),
    );
  };

  // Загрузить данные через api
  useEffect(() => {
    let skeletonTimer: ReturnType<typeof setTimeout>; // NodeJS.Timeout

    const fetchMessages = async () => {
      try {
        setLoading(true);

        // Показывать скелеты, если запрос выполняется дольше 200мс
        skeletonTimer = setTimeout(() => {
          setShowSkeleton(true);
        }, 200);

        let graphqlSortingPayload: Record<string, any> | null = null;
        if (sorting.length > 0) {
          const activeSort = sorting[0]; // Extract the primary active sorting target row node
          const sortDirection = activeSort.desc ? "DESC" : "ASC";

          // Check if we are sorting by a nested relation column property (e.g., 'route.domainName')
          if (activeSort.id.includes("_")) {
            const [parent, child] = activeSort.id.split("_");
            graphqlSortingPayload = {
              [parent]: {
                [child]: sortDirection,
              },
            };
          } else {
            // Standard root column ordering (e.g., 'startDate')
            graphqlSortingPayload = {
              [activeSort.id]: sortDirection,
            };
          }
        }

        const graphqlQuery = `
        query GetFilteredPage($page: Int!, $size: Int!, $filters: MessageFilter, $search: String, $order: MessageOrder) {
          messagesPage(page: $page, size: $size, filters: $filters, search: $search, order: $order) {
            count
            results {
              exchangeId
              requestId
              status
              errorMessage
              updateStatusAttempts
              startDate
              route {
                name
                domainName
              }
            }
          }
        }
      `;

        const payload = {
          query: graphqlQuery,
          variables: {
            page: pageIndex + 1,
            size: pageSize,
            filters: committedFilters,
            search: globalFilter || undefined,
            order: graphqlSortingPayload,
          },
        };

        const res = await api.post("/api/graphql", payload);
        const dataPayload = res.data.data.messagesPage;

        setData(dataPayload.results);
        setTotalCount(dataPayload.count);
      } catch (error: any) {
        toaster.create({
          title: error.message,
          type: "error",
          duration: 6000,
        });
      } finally {
        clearTimeout(skeletonTimer);
        setLoading(false);
        setShowSkeleton(false);
      }
    };

    fetchMessages();
    return () => clearTimeout(skeletonTimer);
  }, [pageIndex, pageSize, committedFilters, globalFilter, sorting]);

  const globalFilterClearButton = globalFilterInput ? (
    <CloseButton
      size="xs"
      onClick={() => {
        setGlobalFilterInput("");
        if (globalFilter) setGlobalFilter("");
        inputRef.current?.focus();
      }}
      me="-2"
    />
  ) : undefined;

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter: globalFilterInput,
      columnFilters,
      columnVisibility,
      pagination: paginationState,
      columnOrder,
    },
    manualPagination: true,
    manualSorting: true,
    rowCount: totalCount,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const currentDraftTree = compileGraphQLFilters(activeFilters);
  console.log("active filters", activeFilters);
  const isApplyDisabled =
    // 🚩 Rule 1: Disable if any active input field row is empty or incomplete
    activeFilters.some((row) => {
      if (!row.column) return true;
      if (row.operation === "isnull" || row.operation === "notnull")
        return false;
      return (
        row.value === undefined ||
        row.value === null ||
        String(row.value).trim() === ""
      );
    }) ||
    // 🚩 Rule 2: Disable if the compiled draft matches what was already sent to the backend API
    JSON.stringify(currentDraftTree) === JSON.stringify(committedFilters);

  return (
    <Stack width="full" gap={5}>
      <Flex justifyContent="space-between" gap={4}>
        {/* Глобальный поиск */}
        <Group attached>
          <InputGroup
            flex="1"
            startElement={<LuSearch />}
            endElement={globalFilterClearButton}
          >
            <Input
              size="sm"
              placeholder="Поиск по всем столбцам"
              value={globalFilterInput}
              onChange={(e) => setGlobalFilterInput(e.target.value)}
              ref={inputRef}
            />
          </InputGroup>
          <Button
            size="sm"
            bg="bg.subtle"
            variant="outline"
            onClick={() => setGlobalFilter(globalFilterInput)}
          >
            Найти
          </Button>
        </Group>

        <HStack gap={2}>
          {/* Кнопка фильтрации */}
          <Button
            size="sm"
            variant={isFilterBlockOpen ? "solid" : "outline"}
            onClick={() => setIsFilterBlockOpen(!isFilterBlockOpen)}
          >
            Фильтр {activeFilters.length > 0 && `(${activeFilters.length})`}
          </Button>

          {/* Выбор отображаемых столбцов */}
          {/* Replace Menu with Popover to avoid mouse drag lock traps */}
          <Popover.Root portalled lazyMount closeOnInteractOutside={false}>
            <Popover.Trigger asChild>
              <Button variant="outline" size="sm">
                <CiViewColumn /> Столбцы
              </Button>
            </Popover.Trigger>

            <Popover.Positioner>
              <Popover.Content
                width="240px"
                p={3}
                boxShadow="md"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.muted"
                zIndex={20}
                overflowX="hidden"
              >
                <Popover.Arrow bg="bg.panel" />
                <Stack gap={2}>
                  <Popover.Title
                    fontSize="xs"
                    fontWeight="bold"
                    color="fg.muted"
                    mb={1}
                  >
                    Видимость и порядок
                  </Popover.Title>

                  <DndContext
                    collisionDetection={closestCenter}
                    modifiers={[
                      restrictToVerticalAxis,
                      restrictToFirstScrollableAncestor,
                    ]}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        setColumnOrder((items) => {
                          const oldIndex = items.indexOf(active.id as string);
                          const newIndex = items.indexOf(over.id as string);
                          return arrayMove(items, oldIndex, newIndex);
                        });
                      }
                    }}
                  >
                    {/* 1. SortableContext monitors the plain column ID string array state */}
                    <SortableContext
                      items={columnOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      <Stack gap={1} maxH="300px" overflowY="auto" pr={1}>
                        {/* 2. ✅ FIX: Loop directly over your active 'columnOrder' state array */}
                        {columnOrder.map((columnId) => {
                          // Fetch the corresponding TanStack column instance by its matching string ID
                          const col = table.getColumn(columnId);

                          // Safety check: if a column isn't hideable/sortable, skip it
                          if (!col || !col.getCanHide()) return null;

                          return (
                            <SortableColumnItem
                              key={col.id}
                              id={col.id}
                              column={col}
                            />
                          );
                        })}
                      </Stack>
                    </SortableContext>
                  </DndContext>
                </Stack>
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Root>
        </HStack>
      </Flex>

      {/* Панель фильтрации */}
      {isFilterBlockOpen && (
        <Box
          p={4}
          borderWidth="1px"
          borderRadius="md"
          bg="bg.muted/20"
          width="full"
        >
          <Stack gap={3}>
            <Heading size="xs">Условия фильтрации</Heading>
            {activeFilters.length === 0 && (
              <Text fontSize="sm" color="fg.muted">
                Условия не заданы. Будут загружены все строки.
              </Text>
            )}

            {activeFilters.map((row) => {
              // Look up current column type metadata from the central registry
              const columnMeta =
                FIELD_REGISTRY[row.column as keyof typeof FIELD_REGISTRY];
              const currentColumnType = columnMeta?.type;

              return (
                <HStack
                  key={`${row.id}-${row.column || "empty"}`}
                  gap={3}
                  width="full"
                >
                  {/* 1. ВЫБОР СТОЛБЦА */}
                  <Select.Root
                    collection={FILTERABLE_COLUMNS_COLLECTION} // Использует сгенерированную из реестра коллекцию
                    value={row.column ? [row.column] : []}
                    onValueChange={(details) => {
                      const selectedColumn = details.value[0];
                      if (selectedColumn) {
                        handleColumnChange(row.id, selectedColumn as any);
                      }
                    }}
                    size="sm"
                    width="200px"
                  >
                    <Select.Trigger>
                      <Select.ValueText placeholder="Выберите поле" />
                    </Select.Trigger>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content zIndex={15}>
                          {FILTERABLE_COLUMNS_COLLECTION.items.map((i) => (
                            <Select.Item item={i} key={i.value}>
                              {i.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>

                  {/* 2. ВЫБОР ОПЕРАТОРА СРАВНЕНИЯ */}
                  {(() => {
                    // Если это строго перечисляемый статус — оператор не нужен (всегда "Равно")
                    if (
                      currentColumnType === "choice" &&
                      !columnMeta.nullable
                    ) {
                      return (
                        <Text
                          fontSize="sm"
                          color="fg.muted"
                          width="180px"
                          textAlign="center"
                          alignSelf="center"
                        >
                          Равно (=)
                        </Text>
                      );
                    }

                    // Фильтруем операторы в зависимости от типа из реестра
                    const allowedItems =
                      currentColumnType === "choice" && columnMeta.nullable
                        ? ALL_OPERATIONS_ITEMS.filter(
                            (op) =>
                              op.value === "exact" ||
                              op.value === "isnull" ||
                              op.value === "notnull",
                          ) // ✅ exact, null, notnull
                        : currentColumnType === "boolean"
                          ? ALL_OPERATIONS_ITEMS.filter(
                              (op) =>
                                op.value === "exact" ||
                                op.value === "isnull" ||
                                op.value === "notnull",
                            )
                          : currentColumnType === "datetime"
                            ? ALL_OPERATIONS_ITEMS.filter(
                                (op) => op.value !== "contains",
                              )
                            : ALL_OPERATIONS_ITEMS;

                    const dynamicOperationsCollection = createListCollection({
                      items: allowedItems,
                    });

                    return (
                      <Select.Root
                        key={`${row.id}-${currentColumnType || "empty"}-operator`}
                        collection={dynamicOperationsCollection}
                        value={[row.operation]}
                        onValueChange={(details) => {
                          // details.value is an array string layout (e.g. ["isnull"])
                          const nextOp = details.value[0];

                          if (nextOp) {
                            const shouldClearValue =
                              nextOp === "isnull" || nextOp === "notnull";

                            updateFilterRow(row.id, {
                              operation: nextOp, // ✅ Passes pure string primitive ("isnull")
                              value: shouldClearValue ? "" : row.value,
                            });
                          }
                        }}
                        size="sm"
                        width="180px"
                        disabled={!row.column}
                      >
                        <Select.Trigger>
                          <Select.ValueText placeholder="Условие" />
                        </Select.Trigger>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content zIndex={15}>
                              {allowedItems.map((item) => (
                                <Select.Item item={item} key={item.value}>
                                  {item.label}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    );
                  })()}

                  {/* 3. ПОЛЯ ДЛЯ ВВОДА ЗНАЧЕНИЯ (Контекстные) */}
                  {(() => {
                    // Если выбрано NULL или NOT NULL — поле ввода значения не отображается
                    if (
                      row.operation === "isnull" ||
                      row.operation === "notnull"
                    )
                      return null;
                    if (!columnMeta)
                      return (
                        <Input
                          size="sm"
                          disabled
                          placeholder="Значение..."
                          flex="1"
                          bg="bg.panel"
                        />
                      );

                    // А. Если поле типа выбор (Choice) — Рендерим выпадающий список вариантов из интерфейса
                    if (currentColumnType === "choice" && columnMeta.choices) {
                      const choiceCollection = createListCollection({
                        items: columnMeta.choices,
                      });

                      const safeSelectValue = row.value
                        ? [String(row.value)]
                        : [];

                      return (
                        <Select.Root
                          collection={choiceCollection}
                          value={safeSelectValue}
                          onValueChange={(details) => {
                            const nextVal = details.value[0];
                            if (nextVal)
                              updateFilterRow(row.id, { value: nextVal });
                          }}
                          size="sm"
                          width="200px"
                        >
                          <Select.Trigger>
                            <Select.ValueText placeholder="Выберите..." />
                          </Select.Trigger>
                          <Portal>
                            <Select.Positioner>
                              <Select.Content zIndex={20}>
                                {columnMeta.choices.map((i) => (
                                  <Select.Item item={i} key={i.value}>
                                    {i.label}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Portal>
                        </Select.Root>
                      );
                    }

                    // Б. Если поле Логическое (Boolean) — Рендерим Да / Нет селектор
                    if (currentColumnType === "boolean") {
                      const safeBoolValue = row.value
                        ? [String(row.value)]
                        : [];

                      return (
                        <Select.Root
                          collection={BOOL_VALUES_COLLECTION}
                          value={safeBoolValue}
                          onValueChange={(details) => {
                            const nextVal = details.value[0];
                            if (nextVal)
                              updateFilterRow(row.id, { value: nextVal });
                          }}
                          size="sm"
                          width="200px"
                        >
                          <Select.Trigger>
                            <Select.ValueText placeholder="Выберите значение" />
                          </Select.Trigger>
                          <Portal>
                            <Select.Positioner>
                              <Select.Content zIndex={20}>
                                {BOOL_VALUES_COLLECTION.items.map((i) => (
                                  <Select.Item item={i} key={i.value}>
                                    {i.label}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Portal>
                        </Select.Root>
                      );
                    }

                    // В. Если поле Дата/Время (Datetime) — Рендерим инпут выбора календаря
                    if (currentColumnType === "datetime") {
                      return (
                        <Input
                          type="datetime-local"
                          step="0.001"
                          size="sm"
                          value={row.value ?? ""}
                          onChange={(e) =>
                            updateFilterRow(row.id, { value: e.target.value })
                          }
                          width="240px"
                          bg="bg.panel"
                        />
                      );
                    }

                    // Г. НАТИВНЫЙ ЧИСЛОВОЙ ИНПУТ ДЛЯ ЧИСЛОВЫХ КОЛОНОК
                    if (currentColumnType === "number") {
                      return (
                        <Input
                          type="number"
                          size="sm"
                          placeholder="Введите число..."
                          // ✅ FIX: If the value is empty or missing during a transition, force "0"
                          // so the element stays strictly controlled across mounts
                          value={
                            row.value === undefined || row.value === null
                              ? ""
                              : String(row.value)
                          }
                          onChange={(e) => {
                            // Allow the user to type normally
                            const inputValue = e.target.value;

                            // ✅ Regex check: Allow only positive integers, or an empty string if clearing out
                            if (/^\d*$/.test(inputValue)) {
                              updateFilterRow(row.id, { value: inputValue });
                            }
                          }}
                          width="150px"
                          bg="bg.panel"
                        />
                      );
                    }

                    // Г. По умолчанию — Обычный текстовый/числовой инпут для строк и чисел
                    return (
                      <Input
                        size="sm"
                        placeholder="Значение..."
                        value={
                          row.value === undefined || row.value === null
                            ? ""
                            : String(row.value)
                        }
                        onChange={(e) => {
                          updateFilterRow(row.id, { value: e.target.value });
                        }}
                        flex="1"
                        bg="bg.panel"
                      />
                    );
                  })()}

                  {/* КНОПКА УДАЛЕНИЯ СТРОКИ */}
                  <IconButton
                    aria-label="Delete filter"
                    variant="ghost"
                    colorPalette="red"
                    size="sm"
                    onClick={() => removeFilterRow(row.id)}
                  >
                    🗑️
                  </IconButton>
                </HStack>
              );
            })}
            {/* Action Control Panel Footer */}
            <Flex justifyContent="space-between" mt={2}>
              <HStack gap={2}>
                <Button size="sm" variant="outline" onClick={addFilterRow}>
                  + Добавить условие
                </Button>

                {activeFilters.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => {
                      setActiveFilters([]);
                      setCommittedFilters(null);
                      localStorage.removeItem("message_table_filters");
                    }}
                  >
                    Сбросить всё
                  </Button>
                )}
              </HStack>

              <Button
                size="sm"
                colorPalette="blue"
                disabled={isApplyDisabled}
                onClick={() => {
                  const compiledTree = compileGraphQLFilters(activeFilters);

                  setCommittedFilters(compiledTree);
                  localStorage.setItem(
                    "message_table_filters",
                    JSON.stringify(activeFilters),
                  );
                }}
              >
                Применить фильтры
              </Button>
            </Flex>
          </Stack>
        </Box>
      )}

      {/* Таблица */}
      <Table.ScrollArea
        borderWidth="1px"
        maxW="1200px"
        rounded="md"
        width="full"
      >
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
      </Table.ScrollArea>

      {/* Пагинация */}
      <Pagination.Root
        pageSize={pageSize}
        page={pageIndex + 1}
        count={totalCount}
        defaultPage={1}
        onPageChange={(details) => {
          table.setPageIndex(details.page - 1);
        }}
      >
        <Flex
          width="full"
          justifyContent="space-between"
          alignItems="center"
          wrap="wrap"
          gap={4}
        >
          <Pagination.PageText
            format={() =>
              totalCount > 0
                ? `${pageIndex * pageSize + 1} - ${Math.min((pageIndex + 1) * pageSize, totalCount)} из ${totalCount}`
                : "0 - 0 из 0"
            }
          />

          <ButtonGroup variant="ghost" size="sm" attached={false}>
            <HStack gap={1}>
              <Pagination.PrevTrigger asChild>
                <IconButton>
                  <LuChevronLeft />
                </IconButton>
              </Pagination.PrevTrigger>

              <Pagination.Items
                render={(page) => (
                  <IconButton variant={{ base: "ghost", _selected: "outline" }}>
                    {page.value}
                  </IconButton>
                )}
              />

              <Pagination.NextTrigger asChild>
                <IconButton>
                  <LuChevronRight />
                </IconButton>
              </Pagination.NextTrigger>
            </HStack>
          </ButtonGroup>

          <Select.Root
            collection={pageSizeOptions}
            value={[pageSize.toString()]}
            onValueChange={(details) => {
              const selectedValue = details.value[0];
              if (selectedValue) {
                handlePageSizeChange(Number(selectedValue));
              }
            }}
            size="sm"
            width="110px"
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>

            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {pageSizeOptions.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Flex>
      </Pagination.Root>
    </Stack>
  );
};

export default Demo;
