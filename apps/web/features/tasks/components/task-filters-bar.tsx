"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  type TaskFilters,
  type UserOption,
} from "@/features/tasks/utils"

export function TaskFiltersBar({
  searchValue,
  onSearchChange,
  values,
  users,
  onChange,
  onClear,
}: {
  searchValue: string
  onSearchChange: (value: string) => void
  values: TaskFilters
  users: UserOption[]
  onChange: (next: TaskFilters) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const { status, priority, assignee, dueFrom, dueTo } = values

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        aria-label={t("tasks.searchLabel")}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t("tasks.searchPlaceholder")}
        className="w-72"
      />
      <Select
        value={status}
        onValueChange={(value) => onChange({ ...values, status: value ?? "" })}
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
          onChange({ ...values, priority: value ?? "" })
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
          onChange({ ...values, assignee: value ?? "" })
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
          onChange({ ...values, dueFrom: event.target.value })
        }
        className="w-36"
      />
      <Input
        aria-label={t("tasks.filters.dueTo")}
        type="date"
        value={dueTo}
        onChange={(event) => onChange({ ...values, dueTo: event.target.value })}
        className="w-36"
      />

      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        {t("tasks.filters.clear")}
      </Button>
    </div>
  )
}
