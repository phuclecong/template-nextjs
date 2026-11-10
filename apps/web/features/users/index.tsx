"use client"

import { useTranslation } from "react-i18next"
import { useGetIdentity } from "@refinedev/core"
import { CurrentUser } from "@/features/users/utils"
import { UsersTable } from "./components/users-table"

export function UsersView() {
  const { t } = useTranslation()
  const { data: identity, isLoading } = useGetIdentity<CurrentUser>()

  if (isLoading || !identity) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    )
  }

  return <UsersTable currentUser={identity} />
}
