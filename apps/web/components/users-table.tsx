"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  useCustomMutation,
  useDelete,
  useGetIdentity,
  useInvalidate,
  useList,
  type HttpError,
} from "@refinedev/core"
import type { Role } from "@workspace/api/collections"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { describeError } from "@/lib/http-error"

type UserApi = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

type CurrentUser = Omit<UserApi, "createdAt">

const ROLE_OPTIONS: Role[] = ["admin", "member"]

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

function UsersTable({ currentUser }: { currentUser: CurrentUser }) {
  const { t } = useTranslation()
  const usersQuery = useList<UserApi>({
    resource: "users",
    pagination: { pageSize: 100 },
  })
  const users = usersQuery.result.data ?? []

  const invalidate = useInvalidate()
  const roleMutation = useCustomMutation<UserApi, HttpError, { role: Role }>({})
  const deleteMutation = useDelete<UserApi>({})

  const [deleteTarget, setDeleteTarget] = useState<UserApi | null>(null)

  const isAdmin = currentUser.role === "admin"

  function changeRole(user: UserApi, role: Role) {
    if (role === user.role) return
    roleMutation.mutate(
      {
        url: `/api/users/${user.id}/role`,
        method: "patch",
        values: { role },
        successNotification: {
          message: t("users.roleUpdated"),
          type: "success",
        },
        errorNotification: (error) => ({
          message: t("users.failedRoleUpdate"),
          type: "error",
          description: describeError(error),
        }),
      },
      {
        onSuccess: () => {
          void invalidate({ resource: "users", invalidates: ["list"] })
        },
      }
    )
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(
      {
        resource: "users",
        id: deleteTarget.id,
        successNotification: { message: t("users.deleted"), type: "success" },
        errorNotification: (error) => ({
          message: t("users.failedDelete"),
          type: "error",
          description: describeError(error),
        }),
      },
      { onSuccess: () => setDeleteTarget(null) }
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6 text-sm">
      <h1 className="text-lg font-medium">{t("users.title")}</h1>

      {usersQuery.query.isLoading ? (
        <p className="text-muted-foreground">{t("users.loading")}</p>
      ) : (
        <div className="overflow-auto border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.columns.name")}</TableHead>
                <TableHead>{t("users.columns.email")}</TableHead>
                <TableHead>{t("users.columns.role")}</TableHead>
                {isAdmin ? (
                  <TableHead>{t("users.columns.actions")}</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select
                        value={user.role}
                        onValueChange={(value) => changeRole(user, value as Role)}
                      >
                        <SelectTrigger
                          aria-label={t("users.roleLabel", { name: user.name })}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role} value={role}>
                              {t(`users.role.${role}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      t(`users.role.${user.role}`)
                    )}
                  </TableCell>
                  {isAdmin ? (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setDeleteTarget(user)}
                      >
                        {t("users.delete")}
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={deleteTarget !== null}
        title={t("users.deleteTitle")}
        onClose={() => setDeleteTarget(null)}
      >
        <p className="text-sm text-muted-foreground">
          {t("users.deleteBody", { name: deleteTarget?.name ?? "" })}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteTarget(null)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMutation.mutation.isPending}
            onClick={confirmDelete}
          >
            {t("common.delete")}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
