"use client"

import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  useCustomMutation,
  useDelete,
  useInvalidate,
  useList,
  type HttpError,
} from "@refinedev/core"
import type { ColumnDef } from "@tanstack/react-table"
import type { Role } from "@workspace/api/collections"
import { DataTable } from "@workspace/shared-lib/components"
import { useDialog, useTableState } from "@workspace/shared-lib/hooks"
import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { UsersFilterBar } from "@/features/users/components/users-filter-bar"
import {
  CurrentUser,
  ROLE_OPTIONS,
  toUserCrudFilters,
  UserRow,
} from "@/features/users/utils"
import { describeError } from "@/utils/http-error"

const FILTER_KEYS = ["role"] as const

export function UsersTable({ currentUser }: { currentUser: CurrentUser }) {
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

  const usersQuery = useList<UserRow>({
    resource: "users",
    pagination: { currentPage: page, pageSize },
    sorters,
    filters,
  })
  const users = usersQuery.result.data ?? []
  const total = usersQuery.result.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const invalidate = useInvalidate()
  const roleMutation = useCustomMutation<UserRow, HttpError, { role: Role }>({})
  const deleteMutation = useDelete<UserRow>({})

  const deleteDialog = useDialog<UserRow>()
  // Bind `open` to a stable local so the `columns` memo below can depend on it
  // (a `useCallback`) rather than on the fresh `deleteDialog` object.
  const openDelete = deleteDialog.open

  const isAdmin = currentUser.role === "admin"

  const changeRole = useCallback(
    (user: UserRow, role: Role) => {
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

  const columns = useMemo<ColumnDef<UserRow>[]>(() => {
    const cols: ColumnDef<UserRow>[] = [
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
            onClick={() => openDelete(row.original)}
          >
            {t("users.delete")}
          </Button>
        ),
      })
    }

    return cols
  }, [t, isAdmin, changeRole, openDelete])

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

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        title={t("users.deleteTitle")}
        description={t("users.deleteBody", { name: deleteDialog.data?.name ?? "" })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        loading={deleteMutation.mutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
