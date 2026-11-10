"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  type TaskPriority,
  type TaskStatus,
  type UserOption,
} from "@/features/tasks/utils"

export function TaskBulkActions({
  hasSelection,
  selectedCount,
  users,
  applyBulk,
  onCreate,
}: {
  hasSelection: boolean
  selectedCount: number
  users: UserOption[]
  applyBulk: (patch: {
    status?: TaskStatus
    priority?: TaskPriority | null
    assigneeId?: string | null
    dueDate?: string | null
  }) => void
  onCreate: () => void
}) {
  const { t } = useTranslation()
  const [dueDate, setDueDate] = useState("")

  return (
    <div className="flex items-center gap-2">
      {hasSelection ? (
        <span className="text-muted-foreground">
          {t("tasks.selectedCount", { count: selectedCount })}
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
            <DropdownMenuItem onClick={() => applyBulk({})}>
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
            <DropdownMenuItem onClick={() => applyBulk({})}>
              {t("tasks.unassigned")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasSelection}
          onClick={() => applyBulk({ dueDate: null })}
        >
          {t("tasks.bulk.clearDueDate")}
        </Button>

        <Input
          aria-label={t("tasks.bulk.setDueDate")}
          type="date"
          value={dueDate}
          disabled={!hasSelection}
          onChange={(event) => {
            const value = event.target.value
            if (!value) return
            applyBulk({ dueDate: value })
            setDueDate("")
          }}
          className="w-36"
        />

        <Button type="button" onClick={onCreate} size="sm">
          {t("tasks.new")}
        </Button>
      </div>
    </div>
  )
}
