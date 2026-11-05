"use client"

import { useTranslation } from "react-i18next"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationItems,
} from "@workspace/ui/components/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100]

type DataTablePagination = {
  page: number
  pageSize: number
  pageCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

type DataTableProps<T> = {
  data: T[]
  columns: ColumnDef<T>[]
  getRowId: (row: T) => string
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  rowSelection: RowSelectionState
  onRowSelectionChange: OnChangeFn<RowSelectionState>
  enableRowSelection?: (row: Row<T>) => boolean
  isLoading?: boolean
  loadingLabel?: string
  emptyLabel?: string
  pagination: DataTablePagination
}

/**
 * Reusable server-paginated table shell. Owns the TanStack table plus the
 * sortable header/body, loading/empty states, and the pagination footer. The
 * caller supplies columns, row identity, selection state, and pagination
 * wiring; filters and bulk/row actions live outside this component.
 */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  enableRowSelection,
  isLoading = false,
  loadingLabel,
  emptyLabel,
  pagination,
}: DataTableProps<T>) {
  const { t } = useTranslation()

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    onSortingChange,
    onRowSelectionChange,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection,
    enableSortingRemoval: false,
    manualSorting: true,
    manualPagination: true,
  })

  const showFooter = data.length > 0

  return (
    <>
      {isLoading ? (
        <p className="text-muted-foreground">{loadingLabel}</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortDirection = header.column.getIsSorted()
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                        aria-sort={
                          sortDirection === "asc"
                            ? "ascending"
                            : sortDirection === "desc"
                              ? "descending"
                              : header.column.getCanSort()
                                ? "none"
                                : undefined
                        }
                        className="items-center gap-1"
                      >
                        {header.column.getCanSort() ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1 text-left"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <span aria-hidden="true">
                              {sortDirection === "asc"
                                ? "↑"
                                : sortDirection === "desc"
                                  ? "↓"
                                  : ""}
                            </span>
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="items-center"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showFooter && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("table.pagination.rowsPerPage")}
            </span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) =>
                pagination.onPageSizeChange(Number(value) || 30)
              }
            >
              <SelectTrigger
                size="sm"
                aria-label={t("table.pagination.rowsPerPage")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {pagination.pageCount > 1 && (
            <Pagination aria-label={t("table.pagination.label")}>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    aria-label={t("table.pagination.prev")}
                    disabled={pagination.page <= 1}
                    onClick={() => pagination.onPageChange(pagination.page - 1)}
                  />
                </PaginationItem>
                {paginationItems(pagination.page, pagination.pageCount).map(
                  (item, index) =>
                    item === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          isActive={item === pagination.page}
                          aria-label={t("table.pagination.pageLabel").replace(
                            "{page}",
                            String(item)
                          )}
                          onClick={() => pagination.onPageChange(item)}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                )}
                <PaginationItem>
                  <PaginationNext
                    aria-label={t("table.pagination.next")}
                    disabled={pagination.page >= pagination.pageCount}
                    onClick={() => pagination.onPageChange(pagination.page + 1)}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </>
  )
}
