import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

// Define the shape of our user data
type User = {
  id: number;
  name: string;
  email: string;
  age: number;
  status: "active" | "inactive";
};

// Shape returned by JSONPlaceholder (we only use a few fields)
type ApiUser = {
  id: number;
  name: string;
  email: string;
};

// Helper to generate a random age between 20 and 60
const randomAge = () => Math.floor(Math.random() * 41) + 20;
// Helper to alternate status so we get a mix
const randomStatus = (): "active" | "inactive" =>
  Math.random() > 0.5 ? "active" : "inactive";

// Map the API response to our User type, filling in synthetic fields
const mapApiUser = (u: ApiUser): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  age: randomAge(),
  status: randomStatus(),
});

// columnHelper gives us type-safe column definitions
const columnHelper = createColumnHelper<User>();

// Define the columns with header labels and accessors
const columns = [
  // Display column — not backed by any data field, used for the selection checkbox
  columnHelper.display({
    id: "select",
    // Disable sorting so clicking the checkbox doesn't also sort
    enableSorting: false,
    header: ({ table }) => (
      // Header checkbox toggles all rows (only visible rows when filtering/sorting)
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        // indeterminate isn't a real HTML attribute — use a callback ref to set it
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomeRowsSelected();
        }}
        onChange={table.getToggleAllRowsSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      // Row-level checkbox toggles just this row
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 cursor-pointer"
      />
    ),
    // Make the checkbox column narrow
    size: 50,
  }),
  columnHelper.accessor("id", {
    header: "ID",
    // Treat numeric IDs as strings so "2" doesn't become a range filter (>= 2)
    filterFn: "includesString",
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("age", {
    header: "Age",
    // Same as ID — string-based filtering so partial input works as expected
    filterFn: "includesString",
  }),
  columnHelper.accessor("status", {
    header: "Status",
    // Dropdown selects exact values, so use exact match
    filterFn: "equalsString",
    // Custom cell rendering: show a badge for the status
    cell: (info) => {
      const status = info.getValue();
      const isActive = status === "active";
      return (
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </span>
      );
    },
  }),
];

export default function UserTable() {
  // Fetch state: data holds the real users, loading/error for UI feedback
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SortingState tracks which column(s) are sorted and in what direction
  const [sorting, setSorting] = useState<SortingState>([]);
  // Global filter is a single text string that TanStack matches against all columns
  const [globalFilter, setGlobalFilter] = useState("");
  // ColumnFiltersState tracks per-column filter values (an array of { id, value })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // RowSelectionState tracks which rows are checked (keyed by row.id)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // VisibilityState tracks which columns are visible (true = visible, false = hidden)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  // PaginationState tracks the current page index and page size (5 rows per page)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  // Fetch users from JSONPlaceholder on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const raw: ApiUser[] = await res.json();
        setData(raw.map(mapApiUser));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Local state for the columns dropdown open/close
  const [columnsOpen, setColumnsOpen] = useState(false);
  // Ref to the dropdown container so we can detect clicks outside and close it
  const columnsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        columnsRef.current &&
        !columnsRef.current.contains(e.target as Node)
      ) {
        setColumnsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // useMemo prevents recreating data/columns on every render
  const tableColumns = useMemo(() => columns, []);

  // Create the table instance with sorting, global filtering, AND pagination enabled
  const table = useReactTable({
    data, // <-- uses the fetched (or empty) data array
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      rowSelection,
      columnVisibility, // <-- makes the table aware of which columns are hidden
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility, // <-- keeps state in sync when columns toggle
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // <-- enables row-level filtering
    // Row selection is built-in — no separate model import needed; it's activated by
    // including rowSelection in the state and providing onRowSelectionChange.
    getPaginationRowModel: getPaginationRowModel(), // <-- slices rows into pages
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">User List</h1>

      {/* Loading spinner */}
      {loading && (
        <div className="mb-4 flex items-center gap-3 text-gray-600">
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Loading users…
        </div>
      )}

      {/* Error message with retry button */}
      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-medium">Error:</span> {error}
          <button
            onClick={() => window.location.reload()}
            className="ml-3 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Toolbar: search + columns button side by side */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          {/* Search icon */}
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search all columns…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>

        {/* Columns visibility button with dropdown */}
        <div className="relative" ref={columnsRef}>
          <button
            onClick={() => setColumnsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            Columns
            <svg
              className={`h-3 w-3 transition ${columnsOpen ? "rotate-180" : ""}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {columnsOpen && (
            <div className="absolute right-0 z-20 mt-1.5 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide()) // built-in: display columns can hide by default
                .map((col) => {
                  // Use the header text as the label, fall back to column id
                  const label =
                    typeof col.columnDef.header === "string"
                      ? col.columnDef.header
                      : col.id;
                  return (
                    <label
                      key={col.id}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={col.getIsVisible()}
                        onChange={col.getToggleVisibilityHandler()}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                      />
                      {label}
                    </label>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Row selection count — shows how many rows are currently checked */}
      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="mb-3 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          {table.getSelectedRowModel().rows.length} row
          {table.getSelectedRowModel().rows.length !== 1 ? "s" : ""} selected
        </div>
      )}

      {/* Scrollable table wrapper — allows header to stay sticky when scrolling */}
      <div className="max-h-[560px] overflow-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full border-collapse">
          {/* Table header — two rows: one for labels, one for column filters */}
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <Fragment key={headerGroup.id}>
                {/* Row 1: column labels with sort on click */}
                <tr className="bg-gray-100">
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted(); // 'asc' | 'desc' | false
                    return (
                      <th
                        key={header.id}
                        // Clicking a column header toggles sorting
                        onClick={header.column.getToggleSortingHandler()}
                        className={`border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 select-none ${
                          sorted ? "text-blue-700" : "hover:text-gray-900"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {/* Sort direction indicator */}
                          {sorted === "asc" && (
                            <svg
                              className="h-3 w-3"
                              viewBox="0 0 12 12"
                              fill="currentColor"
                            >
                              <path d="M6 2l4 6H2z" />
                            </svg>
                          )}
                          {sorted === "desc" && (
                            <svg
                              className="h-3 w-3"
                              viewBox="0 0 12 12"
                              fill="currentColor"
                            >
                              <path d="M6 10l4-6H2z" />
                            </svg>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
                {/* Row 2: per-column filter inputs */}
                <tr className="bg-gray-50">
                  {headerGroup.headers.map((header) => {
                    const column = header.column;
                    const filterValue = column.getFilterValue() as
                      | string
                      | undefined;
                    return (
                      <th
                        key={header.id}
                        className="border-b border-gray-200 px-2 py-2"
                      >
                        {/* Different filter UI based on column data type */}
                        {column.id === "select" ? (
                          // Checkbox column: no filter, just an empty cell
                          <span />
                        ) : column.id === "status" ? (
                          // Status column: dropdown with all / active / inactive
                          <select
                            value={(filterValue as string) ?? ""}
                            onChange={(e) =>
                              column.setFilterValue(e.target.value || undefined)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none"
                          >
                            <option value="">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : column.id === "id" || column.id === "age" ? (
                          // Numeric columns: text input (filterFn converts to string for comparison)
                          <input
                            type="text"
                            value={(filterValue as string) ?? ""}
                            onChange={(e) =>
                              column.setFilterValue(e.target.value || undefined)
                            }
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Filter…"
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600 placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none"
                          />
                        ) : (
                          // Text columns (name, email): text input
                          <input
                            type="text"
                            value={(filterValue as string) ?? ""}
                            onChange={(e) =>
                              column.setFilterValue(e.target.value || undefined)
                            }
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Filter…"
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600 placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none"
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              </Fragment>
            ))}
          </thead>
          {/* Table body */}
          <tbody>
            {table.getRowModel().rows.map((row, rowIdx) => (
              <tr
                key={row.id}
                // Alternating background + hover highlight
                className={`transition ${
                  rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                } hover:bg-blue-50 ${row.getIsSelected() ? "bg-blue-50/60" : ""}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-b border-gray-100 px-4 py-3 text-sm text-gray-700 last:border-b-0"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {/* Empty state when no data matches filters */}
            {table.getRowModel().rows.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {/* Page size selector */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <label htmlFor="page-size">Rows per page:</label>
          <select
            id="page-size"
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none"
          >
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation buttons and page info */}
        <div className="flex items-center gap-2">
          {/* "Page X of Y" indicator — uses 1-based numbering for display */}
          <span className="mr-1 text-sm text-gray-500">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          {/* Previous button — disabled on first page */}
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Prev
          </button>

          {/* Next button — disabled on last page */}
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
