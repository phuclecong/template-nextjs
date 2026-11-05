"use client"

import { useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useGetIdentity, useInfiniteList, useList } from "@refinedev/core"
import type { CrudFilter, CrudSort } from "@refinedev/core"
import type { TaskPriority, TaskStatus } from "@workspace/api/collections"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { debounce } from "@/lib/debounce"
import { DeleteTaskDialog, TaskFormDialog } from "@/components/task-dialogs"

const PAGE_SIZE = 30
const SEARCH_DEBOUNCE_MS = 300

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

export function TasksView() {
  const { t } = useTranslation()
  const { data: identity, isLoading } = useGetIdentity<CurrentUser>()

  // Wait for identity before mounting the data hooks: getIdentity() also
  // loads the in-memory access token, which the dataProvider needs to attach
  // to /api/tasks requests.
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
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([
    { id: "title", desc: false },
  ])
  const [formOpen, setFormOpen] = useState(false)
  const [formTask, setFormTask] = useState<TaskRow | null>(null)
  const [formResetKey, setFormResetKey] = useState(0)
  const [deleteTask, setDeleteTask] = useState<TaskRow | null>(null)

  const debouncedSetQuery = useMemo(
    () =>
      debounce((value: string) => setDebouncedQuery(value), SEARCH_DEBOUNCE_MS),
    []
  )

  useEffect(() => () => debouncedSetQuery.cancel(), [debouncedSetQuery])

  const sorters = useMemo<CrudSort[]>(() => {
    const sort = sorting[0]
    if (!sort) return []
    return [{ field: sort.id, order: sort.desc ? "desc" : "asc" }]
  }, [sorting])

  const filters = useMemo<CrudFilter[]>(() => {
    if (!debouncedQuery) return []
    return [{ field: "q", operator: "contains", value: debouncedQuery }]
  }, [debouncedQuery])

  const tasksQuery = useInfiniteList<TaskApi>({
    resource: "tasks",
    pagination: { pageSize: PAGE_SIZE },
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

  const {
    data: pages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
  } = tasksQuery.query

  const allTasks = useMemo(
    () => pages?.pages.flatMap((page) => page.data) ?? [],
    [pages]
  )

  const rows = useMemo<TaskRow[]>(
    () =>
      allTasks.map((task) => ({
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
    [allTasks, assigneeMap, currentUser, t]
  )

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return []
    return allTasks.slice(0, 8).map((task) => task.title)
  }, [debouncedQuery, allTasks])

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
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={!row.original.canModify}
              onClick={() => openEdit(row.original)}
            >
              {t("tasks.edit")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={!row.original.canModify}
              onClick={() => openDelete(row.original)}
            >
              {t("common.delete")}
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, openDelete, t]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1]
    if (
      last &&
      last.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage()
    }
  }, [
    virtualItems,
    rows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ])

  function onSearchChange(value: string) {
    setQuery(value)
    setSuggestionsOpen(value.length > 0)
    debouncedSetQuery(value)
  }

  function onSuggestionClick(title: string) {
    debouncedSetQuery.cancel()
    setQuery(title)
    setDebouncedQuery(title)
    setSuggestionsOpen(false)
  }

  return (
    <div className="flex flex-col gap-4 p-6 text-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">{t("tasks.title")}</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Input
              aria-label={t("tasks.searchLabel")}
              value={query}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("tasks.searchPlaceholder")}
            />
            {suggestionsOpen && debouncedQuery && suggestions.length > 0 ? (
              <ul
                role="listbox"
                aria-label={t("tasks.suggestionsLabel")}
                className="absolute inset-x-0 top-full z-10 mt-1 border border-border bg-background shadow-sm"
              >
                {suggestions.map((title) => (
                  <li key={title} role="option">
                    <button
                      type="button"
                      onClick={() => onSuggestionClick(title)}
                      className="block w-full px-2.5 py-1.5 text-left hover:bg-muted"
                    >
                      {title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <Button type="button" onClick={openCreate}>
            {t("tasks.new")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t("tasks.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">{t("tasks.empty")}</p>
      ) : (
        <div
          ref={containerRef}
          className="h-[60vh] overflow-auto border border-border"
        >
          <Table style={{ display: "grid" }}>
            <TableHeader
              style={{ display: "grid", position: "sticky", top: 0, zIndex: 1 }}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  style={{ display: "flex", width: "100%" }}
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      style={{ display: "flex", width: header.getSize() }}
                      className={`items-center gap-1 ${
                        header.column.getCanSort() ? "cursor-pointer" : ""
                      }`}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted()
                        ? header.column.getIsSorted() === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody
              style={{
                display: "grid",
                position: "relative",
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {virtualItems.map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index]
                if (!row) return null
                return (
                  <TableRow
                    key={row.id}
                    style={{
                      display: "flex",
                      position: "absolute",
                      top: 0,
                      transform: `translateY(${virtualRow.start}px)`,
                      height: `${virtualRow.size}px`,
                      width: "100%",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          display: "flex",
                          width: cell.column.getSize(),
                        }}
                        className="items-center"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {isFetchingNextPage ? (
            <p className="px-3 py-2 text-muted-foreground">
              {t("tasks.loadingMore")}
            </p>
          ) : null}
        </div>
      )}

      <TaskFormDialog
        key={formResetKey}
        open={formOpen}
        task={formTask}
        users={usersQuery.result.data ?? []}
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
