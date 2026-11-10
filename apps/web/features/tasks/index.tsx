"use client"

import { useTranslation } from "react-i18next"
import { useGetIdentity } from "@refinedev/core"
import { TasksTable } from "./components/tasks-table"
import { CurrentUser } from "@/features/users/utils"

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
