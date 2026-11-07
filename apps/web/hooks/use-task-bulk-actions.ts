"use client"

import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  useCustomMutation,
  useInvalidate,
  type HttpError,
} from "@refinedev/core"
import type { TaskPriority, TaskStatus } from "@/lib/tasks"
import { describeError } from "@/lib/http-error"

type BulkPatch = {
  status?: TaskStatus
  priority?: TaskPriority | null
  assigneeId?: string | null
  dueDate?: string | null
}

type BulkUpdateRequest = { ids: string[] } & BulkPatch

type BulkUpdateResponse = {
  updated: number
  failed: { id: string; reason: string }[]
}

/**
 * Write path for bulk task updates: apply a Status/Priority/Assignee patch to
 * the selected tasks via `/api/tasks/bulk`, then invalidate the task list and
 * clear the selection.
 */
export function useTaskBulkActions({
  selectedIds,
  onDone,
}: {
  selectedIds: string[]
  onDone: () => void
}) {
  const { t } = useTranslation()
  const invalidate = useInvalidate()
  const bulkMutation = useCustomMutation<
    BulkUpdateResponse,
    HttpError,
    BulkUpdateRequest
  >({})

  const applyBulk = useCallback(
    (patch: BulkPatch) => {
      if (selectedIds.length === 0) return
      bulkMutation.mutate(
        {
          url: "/api/tasks/bulk",
          method: "patch",
          values: { ids: selectedIds, ...patch },
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
            onDone()
            void invalidate({ resource: "tasks", invalidates: ["list"] })
          },
        }
      )
    },
    [selectedIds, bulkMutation, invalidate, onDone, t]
  )

  return { applyBulk }
}
