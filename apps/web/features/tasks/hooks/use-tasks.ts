"use client"

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useList, type CrudFilter, type CrudSort } from "@refinedev/core"
import {
  type TaskRecord,
  type TaskRow,
  type UserOption,
} from "@/features/tasks/utils"

import { CurrentUser } from "@/features/users/utils"

type UseTasksArgs = {
  currentUser: CurrentUser
  page: number
  pageSize: number
  sorters: CrudSort[]
  filters: CrudFilter[]
}

/**
 * Read path for the task table: fetch the current task page and the user list,
 * then map each task to a `TaskRow` — resolving the assignee's display name and
 * whether the current user may modify the task.
 */
export function useTasks({
  currentUser,
  page,
  pageSize,
  sorters,
  filters,
}: UseTasksArgs) {
  const { t } = useTranslation()

  const tasksQuery = useList<TaskRecord>({
    resource: "tasks",
    pagination: { currentPage: page, pageSize },
    sorters,
    filters,
  })

  const usersQuery = useList<UserOption>({
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

  const rows = useMemo<TaskRow[]>(
    () =>
      (tasksQuery.result.data ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description ?? null,
        status: task.status,
        priority: task.priority ?? null,
        assigneeId: task.assigneeId ?? null,
        assigneeName: task.assigneeId
          ? (assigneeMap.get(task.assigneeId) ?? t("tasks.unknown"))
          : t("tasks.unassigned"),
        dueDate: task.dueDate ?? null,
        canModify:
          currentUser.role === "admin" || task.assigneeId === currentUser.id,
      })),
    [tasksQuery.result.data, assigneeMap, currentUser, t]
  )

  return {
    rows,
    users: usersQuery.result.data ?? [],
    total: tasksQuery.result.total ?? 0,
    isLoading: tasksQuery.query.isLoading,
  }
}
