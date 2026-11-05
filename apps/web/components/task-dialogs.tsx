"use client"

import { useId, useState } from "react"
import { useCreate, useDelete, useUpdate, type HttpError } from "@refinedev/core"
import type { TaskPriority, TaskStatus } from "@workspace/api/collections"
import { Button } from "@workspace/ui/components/button"
import { Modal } from "@/components/modal"
import { describeError } from "@/lib/http-error"

/** The shape of a task the write path needs; rows from the table satisfy it. */
export type TaskWriteData = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority | null
  assigneeId: string | null
  dueDate: string | null
}

type TaskPayload = {
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority | null
  assigneeId: string | null
  dueDate: string | null
}

type UserOption = { id: string; name: string }

type TaskFormValues = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority | ""
  assigneeId: string
  dueDate: string
}

const STATUS_OPTIONS: TaskStatus[] = ["todo", "in-progress", "done", "blocked"]
const PRIORITY_OPTIONS: TaskPriority[] = ["low", "medium", "high"]

const fieldClass =
  "w-full rounded-none border border-input bg-background px-2.5 py-1.5 text-sm"

function toFormValues(task: TaskWriteData | null): TaskFormValues {
  if (!task) {
    return {
      title: "",
      description: "",
      status: "todo",
      priority: "",
      assigneeId: "",
      dueDate: "",
    }
  }
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority ?? "",
    assigneeId: task.assigneeId ?? "",
    dueDate: task.dueDate ?? "",
  }
}

function toPayload(values: TaskFormValues): TaskPayload {
  return {
    title: values.title.trim(),
    description: values.description.trim() === "" ? null : values.description,
    status: values.status,
    priority: values.priority === "" ? null : values.priority,
    assigneeId: values.assigneeId === "" ? null : values.assigneeId,
    dueDate: values.dueDate === "" ? null : values.dueDate,
  }
}

export function TaskFormDialog({
  open,
  task,
  users,
  onClose,
}: {
  open: boolean
  task: TaskWriteData | null
  users: UserOption[]
  onClose: () => void
}) {
  const isEdit = task !== null
  const [values, setValues] = useState<TaskFormValues>(() => toFormValues(task))
  const id = useId()

  const createMutation = useCreate<TaskWriteData, HttpError, TaskPayload>({
    resource: "tasks",
  })
  const updateMutation = useUpdate<TaskWriteData, HttpError, TaskPayload>({
    resource: "tasks",
  })

  const isPending = isEdit
    ? updateMutation.mutation.isPending
    : createMutation.mutation.isPending

  function setField<Key extends keyof TaskFormValues>(
    key: Key,
    value: TaskFormValues[Key]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = toPayload(values)
    if (payload.title === "") return

    const successNotification = {
      message: isEdit ? "Task updated" : "Task created",
      type: "success" as const,
    }
    const errorNotification = (error?: HttpError) => ({
      message: isEdit ? "Failed to update task" : "Failed to create task",
      type: "error" as const,
      description: describeError(error),
    })

    if (isEdit && task) {
      updateMutation.mutate(
        {
          resource: "tasks",
          id: task.id,
          values: payload,
          invalidates: ["resourceAll"],
          successNotification,
          errorNotification,
        },
        { onSuccess: onClose }
      )
      return
    }
    createMutation.mutate(
      {
        resource: "tasks",
        values: payload,
        invalidates: ["resourceAll"],
        successNotification,
        errorNotification,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit task" : "New task"}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-title`}>Title</label>
          <input
            id={`${id}-title`}
            value={values.title}
            onChange={(event) => setField("title", event.target.value)}
            required
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-description`}>Description</label>
          <textarea
            id={`${id}-description`}
            value={values.description}
            onChange={(event) => setField("description", event.target.value)}
            rows={3}
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-status`}>Status</label>
            <select
              id={`${id}-status`}
              value={values.status}
              onChange={(event) =>
                setField("status", event.target.value as TaskStatus)
              }
              className={fieldClass}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-priority`}>Priority</label>
            <select
              id={`${id}-priority`}
              value={values.priority}
              onChange={(event) =>
                setField("priority", event.target.value as TaskPriority | "")
              }
              className={fieldClass}
            >
              <option value="">None</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-assignee`}>Assignee</label>
            <select
              id={`${id}-assignee`}
              value={values.assigneeId}
              onChange={(event) => setField("assigneeId", event.target.value)}
              className={fieldClass}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-due-date`}>Due date</label>
            <input
              id={`${id}-due-date`}
              type="date"
              value={values.dueDate}
              onChange={(event) => setField("dueDate", event.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function DeleteTaskDialog({
  open,
  task,
  onClose,
}: {
  open: boolean
  task: TaskWriteData | null
  onClose: () => void
}) {
  const deleteMutation = useDelete<TaskWriteData>({})

  function onConfirm() {
    if (!task) return
    deleteMutation.mutate(
      {
        resource: "tasks",
        id: task.id,
        invalidates: ["resourceAll"],
        successNotification: {
          message: "Task deleted",
          type: "success",
        },
        errorNotification: (error?: HttpError) => ({
          message: "Failed to delete task",
          type: "error",
          description: describeError(error),
        }),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal open={open} title="Delete task?" onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        Delete <span className="font-medium text-foreground">{task?.title}</span>
        ? This cannot be undone.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={deleteMutation.mutation.isPending}
          onClick={onConfirm}
        >
          Delete
        </Button>
      </div>
    </Modal>
  )
}
