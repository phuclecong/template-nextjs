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
import { ROLE_OPTIONS } from "@/features/users/utils"

export function UsersFilterBar({
  searchValue,
  onSearchChange,
  role,
  onRoleChange,
  onClear,
}: {
  searchValue: string
  onSearchChange: (value: string) => void
  role: string
  onRoleChange: (role: string) => void
  onClear: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        aria-label={t("users.searchLabel")}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t("users.searchPlaceholder")}
        className="w-72"
      />
      <Select value={role} onValueChange={(value) => onRoleChange(value ?? "")}>
        <SelectTrigger aria-label={t("users.filters.role")}>
          <SelectValue placeholder={t("users.filters.role")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{t("users.filters.all")}</SelectItem>
          {ROLE_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {t(`users.role.${option}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        {t("users.filters.clear")}
      </Button>
    </div>
  )
}
