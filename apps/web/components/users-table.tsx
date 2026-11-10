"use client"

import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  useCustomMutation,
  useDelete,
  useGetIdentity,
  useInvalidate,
  useList,
  type HttpError,
} from "@refinedev/core"
import type { ColumnDef } from "@tanstack/react-table"
import type { Role } from "@workspace/api/collections"
import { DataTable } from "@workspace/shared-lib/components"
import { useDialog, useTableState } from "@workspace/shared-lib/hooks"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { UsersFilterBar } from "@/components/users-filter-bar"
import { describeError } from "@/utils/http-error"
import { ROLE_OPTIONS, toUserCrudFilters } from "@/utils/users"

type UserApi = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

type CurrentUser = Omit<UserApi, "createdAt">

const FILTER_KEYS = ["role"] as const

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
    updateParams,
  } = useTableState({ defaultSortField: "name", filterKeys: FILTER_KEYS })

  const role = filterValues.role
  const hasActiveFilters = Boolean(q || role)
  const filters = useMemo(
    () => toUserCrudFilters(q, filterValues),
    [q, filterValues]
  )

  const usersQuery = useList<UserApi>({
    resource: "users",
    pagination: { currentPage: page, pageSize },
    sorters,
    filters,
  })
  const users = usersQuery.result.data ?? []
  const total = usersQuery.result.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const invalidate = useInvalidate()
  const roleMutation = useCustomMutation<UserApi, HttpError, { role: Role }>({})
  const deleteMutation = useDelete<UserApi>({})

  const deleteDialog = useDialog<UserApi>()
  // Bind `open` to a stable local so the `columns` memo below can depend on it
  // (a `useCallback`) rather than on the fresh `deleteDialog` object.
  const openDelete = deleteDialog.open

  const isAdmin = currentUser.role === "admin"

  const changeRole = useCallback(
    (user: UserApi, role: Role) => {
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
    },
    [roleMutation, invalidate, t]
  )

  const confirmDelete = useCallback(() => {
    if (!deleteDialog.data) return
    deleteMutation.mutate(
      {
        resource: "users",
        id: deleteDialog.data.id,
        successNotification: { message: t("users.deleted"), type: "success" },
        errorNotification: (error) => ({
          message: t("users.failedDelete"),
          type: "error",
          description: describeError(error),
        }),
      },
      { onSuccess: deleteDialog.close }
    )
  }, [deleteDialog.data, deleteDialog.close, deleteMutation, t])

  const columns = useMemo<ColumnDef<UserApi>[]>(() => {
    const cols: ColumnDef<UserApi>[] = [
      { accessorKey: "name", header: t("users.columns.name"), size: 220 },
      { accessorKey: "email", header: t("users.columns.email"), size: 300 },
      {
        accessorKey: "role",
        header: t("users.columns.role"),
        size: 160,
        cell: ({ row }) =>
          isAdmin ? (
            <Select
              value={row.original.role}
              onValueChange={(value) => changeRole(row.original, value as Role)}
            >
              <SelectTrigger
                aria-label={t("users.roleLabel", { name: row.original.name })}
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
            t(`users.role.${row.original.role}`)
          ),
      },
    ]

    if (isAdmin) {
      cols.push({
        id: "actions",
        header: t("users.columns.actions"),
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => deleteDialog.open(row.original)}
          >
            {t("users.delete")}
          </Button>
        ),
      })
    }

    return cols
  }, [t, isAdmin, changeRole, deleteDialog])

  return (
    <div className="flex flex-col gap-4 p-6 text-sm">
      {/* <h1 className="text-lg font-medium">{t("users.title")}</h1> */}

      <UsersFilterBar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        role={role}
        onRoleChange={(value) => updateParams({ role: value, page: "" })}
        onClear={() => updateParams({ role: "", page: "" })}
      />

      <DataTable
        data={users}
        columns={columns}
        getRowId={(row) => row.id}
        sorting={sorting}
        onSortingChange={onSortingChange}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableRowSelection={() => false}
        isLoading={usersQuery.query.isLoading}
        loadingLabel={t("users.loading")}
        emptyLabel={
          hasActiveFilters ? t("users.emptyNoMatch") : t("users.empty")
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

      <Dialog
        open={deleteDialog.isOpen}
        title={t("users.deleteTitle")}
        onClose={deleteDialog.close}
      >
        <p className="text-sm text-muted-foreground">
          {t("users.deleteBody", { name: deleteDialog.data?.name ?? "" })}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={deleteDialog.close}>
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
