"use client"

import { useMemo, useRef, useState, useEffect } from "react"
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
import { debounce } from "@/lib/debounce"

const PAGE_SIZE = 30
const SEARCH_DEBOUNCE_MS = 300

type TaskApi = {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority | null
  assigneeId: string | null
  dueDate: string | null
}

type UserApi = {
  id: string
  name: string
}

type TaskRow = {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority | null
  assigneeName: string
  dueDate: string | null
}

export function TasksView() {
  const { isLoading } = useGetIdentity<{ name: string }>()

  // Wait for identity before mounting the data hooks: getIdentity() also
  // loads the in-memory access token, which the dataProvider needs to attach
  // to /api/tasks requests.
  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>
  }

  return <TasksTable />
}

function TasksTable() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([
    { id: "title", desc: false },
  ])

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
        status: task.status,
        priority: task.priority,
        assigneeName: task.assigneeId
          ? (assigneeMap.get(task.assigneeId) ?? "Unknown")
          : "Unassigned",
        dueDate: task.dueDate,
      })),
    [allTasks, assigneeMap]
  )

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return []
    return allTasks.slice(0, 8).map((task) => task.title)
  }, [debouncedQuery, allTasks])

  const columns = useMemo<ColumnDef<TaskRow>[]>(
    () => [
      { accessorKey: "title", header: "Title" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "priority", header: "Priority" },
      { accessorKey: "assigneeName", header: "Assignee", enableSorting: false },
      { accessorKey: "dueDate", header: "Due date" },
    ],
    []
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
        <h1 className="text-lg font-medium">Tasks</h1>
        <div className="relative w-72">
          <input
            aria-label="Search tasks"
            value={query}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks…"
            className="w-full rounded-none border border-input bg-background px-2.5 py-1.5"
          />
          {suggestionsOpen && debouncedQuery && suggestions.length > 0 ? (
            <ul
              role="listbox"
              aria-label="Title suggestions"
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
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading tasks…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">No tasks match your search.</p>
      ) : (
        <div
          ref={containerRef}
          className="h-[60vh] overflow-auto border border-border"
        >
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      className={`border-b border-border px-3 py-2 font-medium ${
                        header.column.getCanSort() ? "cursor-pointer" : ""
                      }`}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted()
                        ? header.column.getIsSorted() === "asc"
                          ? " ↑"
                          : " ↓"
                        : null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index]
                if (!row) return null
                return (
                  <tr
                    key={row.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      transform: `translateY(${virtualRow.start}px)`,
                      height: `${virtualRow.size}px`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="border-b border-border px-3 py-2 align-middle"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {isFetchingNextPage ? (
            <p className="px-3 py-2 text-muted-foreground">Loading more…</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
