"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  useCustomMutation,
  useGetIdentity,
  useInvalidate,
  useList,
} from "@refinedev/core"
import type { CrudFilter, CrudSort, HttpError } from "@refinedev/core"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { TaskPriority, TaskStatus } from "@workspace/api/collections"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Pagination } from "@workspace/ui/components/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { debounce } from "@/lib/debounce"
import { describeError } from "@/lib/http-error"
import { DeleteTaskDialog, TaskFormDialog } from "@/components/task-dialogs"

const PAGE_SIZE = 30
const SEARCH_DEBOUNCE_MS = 300
const STATUS_OPTIONS: TaskStatus[] = ["todo", "in-progress", "done", "blocked"]
const PRIORITY_OPTIONS: TaskPriority[] = ["low", "medium", "high"]

type TaskApi = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority | null
  assigneeId: string | null
  dueDate: string | null
}

type UserApi = {
  id: string
  name: string
}

type CurrentUser = {
  id: string
  name: string
  email: string
  role: "admin" | "member"
}

type TaskRow = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority | null
  assigneeId: string | null
  assigneeName: string
  dueDate: string | null
  canModify: boolean
}

type BulkPatch = {
  status?: TaskStatus
  priority?: TaskPriority | null
  assigneeId?: string | null
}

type BulkUpdateRequest = {
  ids: string[]
} & BulkPatch

type BulkUpdateResponse = {
  updated: number
  failed: { id: string; reason: string }[]
}

/**
 * Memoized actions cell. `task` (the row object) and `onEdit`/`onDelete`
 * (stable `useCallback`s) are referentially stable across renders, so
 * `React.memo` skips re-rendering these buttons when the table re-renders
 * for selection or pagination changes.
 */
const TaskActionsCell = memo(function TaskActionsCell({
  task,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  task: TaskRow
  editLabel: string
  deleteLabel: string
  onEdit: (task: TaskRow) => void
  onDelete: (task: TaskRow) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={!task.canModify}
        onClick={() => onEdit(task)}
      >
        {editLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={!task.canModify}
        onClick={() => onDelete(task)}
      >
        {deleteLabel}
      </Button>
    </div>
  )
})

export function TasksView() {
  const { t } = useTranslation()
  const { data: identity, isLoading } = useGetIdentity<CurrentUser>()

  if (isLoading || !identity) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    )
  }

  return <TasksTable currentUser={identity} />
}

function TasksTable({ currentUser }: { currentUser: CurrentUser }) {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // The URL is the single source of truth for filters, sort, and page.
  const q = searchParams.get("q") ?? ""
  const status = searchParams.get("status") ?? ""
  const priority = searchParams.get("priority") ?? ""
  const assignee = searchParams.get("assignee") ?? ""
  const dueFrom = searchParams.get("dueFrom") ?? ""
  const dueTo = searchParams.get("dueTo") ?? ""
  const sortField = searchParams.get("sort") ?? "title"
  const sortDesc = searchParams.get("order") === "desc"
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)

  // Search input is locally controlled for typing feel; its value is written
  // to the URL (debounced) and mirrored back when the URL changes externally.
  const [query, setQuery] = useState(q)
  const lastQueryRef = useRef(q)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [formOpen, setFormOpen] = useState(false)
  const [formTask, setFormTask] = useState<TaskRow | null>(null)
  const [formResetKey, setFormResetKey] = useState(0)
  const [deleteTask, setDeleteTask] = useState<TaskRow | null>(null)

  useEffect(() => {
    if (q !== lastQueryRef.current) {
      setQuery(q)
      lastQueryRef.current = q
    }
  }, [q])

  // Stable URL writer that always reads the freshest navigation state.
  const writeRef = useRef<
    (next: Record<string, string>, replace?: boolean) => void
  >(() => {})
  writeRef.current = (next, replace) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value === "" || value == null) params.delete(key)
      else params.set(key, value)
    }
    const qs = params.toString()
    const href = pathname + (qs ? `?${qs}` : "")
    if (replace) router.replace(href)
    else router.push(href)
  }
  const updateParams = useCallback(
    (next: Record<string, string>, replace?: boolean) => {
      writeRef.current(next, replace)
    },
    []
  )

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        lastQueryRef.current = value
        updateParams({ q: value, page: "" }, true)
      }, SEARCH_DEBOUNCE_MS),
    [updateParams]
  )
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch])

  const sorters = useMemo<CrudSort[]>(() => {
    return [{ field: sortField, order: sortDesc ? "desc" : "asc" }]
  }, [sortField, sortDesc])

  const filters = useMemo<CrudFilter[]>(() => {
    const result: CrudFilter[] = []
    if (q) result.push({ field: "q", operator: "contains", value: q })
    if (status) result.push({ field: "status", operator: "eq", value: status })
    if (priority)
      result.push({ field: "priority", operator: "eq", value: priority })
    if (assignee)
      result.push({ field: "assigneeId", operator: "eq", value: assignee })
    if (dueFrom)
      result.push({ field: "dueDate", operator: "gte", value: dueFrom })
    if (dueTo) result.push({ field: "dueDate", operator: "lte", value: dueTo })
    return result
  }, [q, status, priority, assignee, dueFrom, dueTo])

  const tasksQuery = useList<TaskApi>({
    resource: "tasks",
    pagination: { currentPage: page, pageSize: PAGE_SIZE },
    sorters,
    filters,
  })

  const usersQuery = useList<UserApi>({
    resource: "users",
    pagination: { pageSize: 100 },
  })

  const assigneeMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const user of usersQuery.result.data ?? []) {
      map.set(user.id, user.name)
    }
    return map
  }, [usersQuery.result.data])

  const total = tasksQuery.result.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const rows = useMemo<TaskRow[]>(
    () =>
      (tasksQuery.result.data ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        assigneeName: task.assigneeId
          ? (assigneeMap.get(task.assigneeId) ?? t("tasks.unknown"))
          : t("tasks.unassigned"),
        dueDate: task.dueDate,
        canModify:
          currentUser.role === "admin" || task.assigneeId === currentUser.id,
      })),
    [tasksQuery.result.data, assigneeMap, currentUser, t]
  )

  const selectedIds = useMemo(() => Object.keys(rowSelection), [rowSelection])
  const hasSelection = selectedIds.length > 0
  const hasActiveFilters = Boolean(
    q || status || priority || assignee || dueFrom || dueTo
  )

  // A page, filter, or sort change invalidates the current selection.
  useEffect(() => {
    setRowSelection({})
  }, [page, status, priority, assignee, dueFrom, dueTo, sortField, sortDesc])

  const invalidate = useInvalidate()
  const bulkMutation = useCustomMutation<
    BulkUpdateResponse,
    HttpError,
    BulkUpdateRequest
  >({})

  const applyBulk = useCallback(
    (patch: BulkPatch) => {
      const ids = Object.keys(rowSelection)
      if (ids.length === 0) return
      bulkMutation.mutate(
        {
          url: "/api/tasks/bulk",
          method: "patch",
          values: { ids, ...patch },
          successNotification: (data) => {
            const result = data?.data
            const failed = result?.failed?.length ?? 0
            if (failed > 0) {
              return {
                message: t("tasks.bulk.updatedWithFailures", {
                  updated: result?.updated ?? 0,
                  failed,
                }),
                type: "error" as const,
              }
            }
            return {
              message: t("tasks.bulk.updated", { count: result?.updated ?? 0 }),
              type: "success" as const,
            }
          },
          errorNotification: (error) => ({
            message: t("tasks.bulk.failed"),
            type: "error" as const,
            description: describeError(error),
          }),
        },
        {
          onSuccess: () => {
            setRowSelection({})
            void invalidate({ resource: "tasks", invalidates: ["list"] })
          },
        }
      )
    },
    [rowSelection, bulkMutation, invalidate, t]
  )

  const openCreate = useCallback(() => {
    setFormTask(null)
    setFormOpen(true)
    setFormResetKey((n) => n + 1)
  }, [])

  const openEdit = useCallback((task: TaskRow) => {
    setFormTask(task)
    setFormOpen(true)
    setFormResetKey((n) => n + 1)
  }, [])

  const closeForm = useCallback(() => setFormOpen(false), [])
  const openDelete = useCallback((task: TaskRow) => setDeleteTask(task), [])
  const closeDelete = useCallback(() => setDeleteTask(null), [])

  const columns = useMemo<ColumnDef<TaskRow>[]>(
    () => [
      {
        id: "select",
        size: 36,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected()
            }
            disabled={
              !table.getRowModel().rows.some((row) => row.getCanSelect())
            }
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(!!checked)
            }
            aria-label={t("tasks.selectAll")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked) => row.toggleSelected(!!checked)}
            aria-label={t("tasks.selectRow", { title: row.original.title })}
          />
        ),
      },
      { accessorKey: "title", header: t("tasks.columns.title"), size: 360 },
      {
        accessorKey: "status",
        header: t("tasks.columns.status"),
        size: 120,
        cell: ({ row }) => t(`tasks.status.${row.original.status}`),
      },
      {
        accessorKey: "priority",
        header: t("tasks.columns.priority"),
        size: 120,
        cell: ({ row }) =>
          row.original.priority
            ? t(`tasks.priority.${row.original.priority}`)
            : "",
      },
      {
        accessorKey: "assigneeName",
        header: t("tasks.columns.assignee"),
        size: 180,
        enableSorting: false,
      },
      { accessorKey: "dueDate", header: t("tasks.columns.dueDate"), size: 140 },
      {
        id: "actions",
        header: t("tasks.columns.actions"),
        size: 140,
        enableSorting: false,
        cell: ({ row }) => (
          <TaskActionsCell
            task={row.original}
            editLabel={t("tasks.edit")}
            deleteLabel={t("common.delete")}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        ),
      },
    ],
    [openEdit, openDelete, t]
  )

  const sorting = useMemo<SortingState>(
    () => [{ id: sortField, desc: sortDesc }],
    [sortField, sortDesc]
  )

  const onSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      const sort = next[0]
      if (sort) {
        updateParams({
          sort: sort.id,
          order: sort.desc ? "desc" : "asc",
          page: "",
        })
      }
    },
    [sorting, updateParams]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, rowSelection },
    onSortingChange,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: (row) => row.original.canModify,
    enableSortingRemoval: false,
    manualSorting: true,
    manualPagination: true,
  })

  const users = usersQuery.result.data ?? []

  return (
    <div className="flex flex-col gap-4 p-6 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={t("tasks.searchLabel")}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            debouncedSearch(event.target.value)
          }}
          placeholder={t("tasks.searchPlaceholder")}
          className="w-72"
        />
        <Select
          value={status}
          onValueChange={(value) =>
            updateParams({ status: value ?? "", page: "" })
          }
        >
          <SelectTrigger aria-label={t("tasks.filters.status")}>
            <SelectValue placeholder={t("tasks.filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("tasks.filters.all")}</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {t(`tasks.status.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priority}
          onValueChange={(value) =>
            updateParams({ priority: value ?? "", page: "" })
          }
        >
          <SelectTrigger aria-label={t("tasks.filters.priority")}>
            <SelectValue placeholder={t("tasks.filters.priority")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("tasks.filters.all")}</SelectItem>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {t(`tasks.priority.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={assignee}
          onValueChange={(value) =>
            updateParams({ assignee: value ?? "", page: "" })
          }
        >
          <SelectTrigger aria-label={t("tasks.filters.assignee")}>
            <SelectValue placeholder={t("tasks.filters.assignee")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("tasks.filters.all")}</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
            <SelectItem value="unassigned">{t("tasks.unassigned")}</SelectItem>
          </SelectContent>
        </Select>

        <Input
          aria-label={t("tasks.filters.dueFrom")}
          type="date"
          value={dueFrom}
          onChange={(event) =>
            updateParams({ dueFrom: event.target.value, page: "" })
          }
          className="w-36"
        />
        <Input
          aria-label={t("tasks.filters.dueTo")}
          type="date"
          value={dueTo}
          onChange={(event) =>
            updateParams({ dueTo: event.target.value, page: "" })
          }
          className="w-36"
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            updateParams({
              status: "",
              priority: "",
              assignee: "",
              dueFrom: "",
              dueTo: "",
              page: "",
            })
          }
        >
          {t("tasks.filters.clear")}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {hasSelection ? (
          <span className="text-muted-foreground">
            {t("tasks.selectedCount", { count: selectedIds.length })}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasSelection}
                />
              }
              disabled={!hasSelection}
            >
              {t("tasks.bulk.updateStatus")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => applyBulk({ status: option })}
                >
                  {t(`tasks.status.${option}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasSelection}
                />
              }
              disabled={!hasSelection}
            >
              {t("tasks.bulk.updatePriority")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {PRIORITY_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => applyBulk({ priority: option })}
                >
                  {t(`tasks.priority.${option}`)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => applyBulk({ priority: null })}>
                {t("tasks.bulk.none")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasSelection}
                />
              }
              disabled={!hasSelection}
            >
              {t("tasks.bulk.assign")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {users.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => applyBulk({ assigneeId: user.id })}
                >
                  {user.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => applyBulk({ assigneeId: null })}>
                {t("tasks.unassigned")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="button" onClick={openCreate} size={"sm"}>
            {t("tasks.new")}
          </Button>
        </div>
      </div>

      {tasksQuery.query.isLoading ? (
        <p className="text-muted-foreground">{t("tasks.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">
          {hasActiveFilters ? t("tasks.emptyNoMatch") : t("tasks.empty")}
        </p>
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

      <div className="flex justify-end">
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          label={t("tasks.pagination.label")}
          prevLabel={t("tasks.pagination.prev")}
          nextLabel={t("tasks.pagination.next")}
          pageLabel={t("tasks.pagination.pageLabel")}
        />
      </div>

      <TaskFormDialog
        key={formResetKey}
        open={formOpen}
        task={formTask}
        users={users}
        onClose={closeForm}
      />
      <DeleteTaskDialog
        open={deleteTask !== null}
        task={deleteTask}
        onClose={closeDelete}
      />
    </div>
  )
}
