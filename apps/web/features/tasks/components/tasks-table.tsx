"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DataTable } from "@workspace/shared-lib/components"
import { useTableState } from "@workspace/shared-lib/hooks"
import { TaskBulkActions } from "@/features/tasks/components/task-bulk-actions"
import { TaskFiltersBar } from "@/features/tasks/components/task-filters-bar"
import {
  DeleteTaskDialog,
  TaskFormDialog,
} from "@/features/tasks/components/task-dialogs"
import { useTaskBulkActions } from "@/features/tasks/hooks/use-task-bulk-actions"
import { useTasks } from "@/features/tasks/hooks/use-tasks"
import { toCrudFilters, type TaskRow, CurrentUser } from "@/features/tasks/utils"

const FILTER_KEYS = [
  "status",
  "priority",
  "assignee",
  "dueFrom",
  "dueTo",
] as const

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

export function TasksTable({ currentUser }: { currentUser: CurrentUser }) {
  const { t } = useTranslation()

  const {
    q,
    searchValue,
    onSearchChange,
    filterValues,
    sorters,
    sorting,
    onSortingChange,
    page,
    pageSize,
    rowSelection,
    setRowSelection,
    selectedIds,
    hasSelection,
    updateParams,
  } = useTableState({
    defaultSortField: "title",
    filterKeys: FILTER_KEYS,
  })

  const { status, priority, assignee, dueFrom, dueTo } = filterValues

  const [formOpen, setFormOpen] = useState(false)
  const [formTask, setFormTask] = useState<TaskRow | null>(null)
  const [formResetKey, setFormResetKey] = useState(0)
  const [deleteTask, setDeleteTask] = useState<TaskRow | null>(null)

  const filters = useMemo(
    () => toCrudFilters(q, filterValues),
    [q, filterValues]
  )

  const { rows, users, total, isLoading } = useTasks({
    currentUser,
    page,
    pageSize,
    sorters,
    filters,
  })

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const hasActiveFilters = Boolean(
    q || status || priority || assignee || dueFrom || dueTo
  )

  const { applyBulk } = useTaskBulkActions({
    selectedIds,
    onDone: () => setRowSelection({}),
  })

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

  return (
    <div className="flex flex-col gap-4 p-6 text-sm">
      <TaskFiltersBar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        values={filterValues}
        users={users}
        onChange={(next) => updateParams({ ...next, page: "" })}
        onClear={() =>
          updateParams({
            status: "",
            priority: "",
            assignee: "",
            dueFrom: "",
            dueTo: "",
            page: "",
          })
        }
      />

      <TaskBulkActions
        hasSelection={hasSelection}
        selectedCount={selectedIds.length}
        users={users}
        applyBulk={applyBulk}
        onCreate={openCreate}
      />

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        sorting={sorting}
        onSortingChange={onSortingChange}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableRowSelection={(row) => row.original.canModify}
        isLoading={isLoading}
        loadingLabel={t("tasks.loading")}
        emptyLabel={
          hasActiveFilters ? t("tasks.emptyNoMatch") : t("tasks.empty")
        }
        pagination={{
          page,
          pageSize,
          pageCount,
          onPageChange: (next) => updateParams({ page: String(next) }),
          onPageSizeChange: (next) =>
            updateParams({ pageSize: String(next), page: "" }),
        }}
      />

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
