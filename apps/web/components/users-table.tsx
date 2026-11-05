"use client"

import { useState } from "react"
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
import { Modal } from "@/components/modal"
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
  const { data: identity, isLoading } = useGetIdentity<CurrentUser>()

  if (isLoading || !identity) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>
  }

  return <UsersTable currentUser={identity} />
}

function UsersTable({ currentUser }: { currentUser: CurrentUser }) {
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
        successNotification: { message: "Role updated", type: "success" },
        errorNotification: (error) => ({
          message: "Failed to update role",
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
        successNotification: { message: "User deleted", type: "success" },
        errorNotification: (error) => ({
          message: "Failed to delete user",
          type: "error",
          description: describeError(error),
        }),
      },
      { onSuccess: () => setDeleteTarget(null) }
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6 text-sm">
      <h1 className="text-lg font-medium">Users</h1>

      {usersQuery.query.isLoading ? (
        <p className="text-muted-foreground">Loading users…</p>
      ) : (
        <div className="overflow-auto border border-border">
          <table className="w-full text-left">
            <thead className="bg-background">
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                {isAdmin ? (
                  <th className="px-3 py-2 font-medium">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border">
                  <td className="px-3 py-2">{user.name}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">
                    {isAdmin ? (
                      <select
                        aria-label={`Role for ${user.name}`}
                        value={user.role}
                        onChange={(event) =>
                          changeRole(user, event.target.value as Role)
                        }
                        className="rounded-none border border-input bg-background px-2 py-1"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  {isAdmin ? (
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setDeleteTarget(user)}
                      >
                        Delete
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={deleteTarget !== null}
        title="Delete user?"
        onClose={() => setDeleteTarget(null)}
      >
        <p className="text-sm text-muted-foreground">
          Delete{" "}
          <span className="font-medium text-foreground">
            {deleteTarget?.name}
          </span>
          ? This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMutation.mutation.isPending}
            onClick={confirmDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
