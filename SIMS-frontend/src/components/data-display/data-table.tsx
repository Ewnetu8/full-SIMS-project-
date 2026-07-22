'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DataTableProps<TData, TValue> {
  columns:     ColumnDef<TData, TValue>[];
  data:        TData[];
  /** Number of rows per page. */
  pageSize?:   number;
  loading?:    boolean;
  className?:  string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Fully featured data table using @tanstack/react-table.
 * Supports client-side sorting and pagination out of the box.
 *
 * @example
 * <DataTable columns={examColumns} data={exams} pageSize={10} />
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  loading = false,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting,         setSorting]         = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state:     { sorting, columnVisibility },
    onSortingChange:         setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel:         getCoreRowModel(),
    getSortedRowModel:       getSortedRowModel(),
    getPaginationRowModel:   getPaginationRowModel(),
    initialState:            { pagination: { pageSize } },
  });

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          {/* Head */}
          <thead className="bg-muted/50 border-b border-border">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'h-11 px-4 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide',
                      header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground',
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                    aria-sort={
                      header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : 'none'
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIcon sorted={header.column.getIsSorted()} />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <TableSkeleton cols={columns.length} rows={pageSize} />
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No results found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing{' '}
          <strong className="text-foreground">
            {table.getRowModel().rows.length}
          </strong>{' '}
          of <strong className="text-foreground">{data.length}</strong> results
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border border-border px-3 py-1 text-xs hover:bg-accent disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-md border border-border px-3 py-1 text-xs hover:bg-accent disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc')  return <ArrowUp   className="h-3 w-3 text-primary" />;
  if (sorted === 'desc') return <ArrowDown className="h-3 w-3 text-primary" />;
  return <ArrowUpDown className="h-3 w-3 opacity-40" />;
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────

function TableSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-3 rounded skeleton-shimmer" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export type { ColumnDef };
