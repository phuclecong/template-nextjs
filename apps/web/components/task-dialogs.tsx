"use client"

import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
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
      message: isEdit ? t("taskDialog.updated") : t("taskDialog.created"),
      type: "success" as const,
    }
    const errorNotification = (error?: HttpError) => ({
      message: isEdit ? t("taskDialog.failedUpdate") : t("taskDialog.failedCreate"),
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
      title={isEdit ? t("taskDialog.editTitle") : t("taskDialog.newTitle")}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-title`}>{t("taskDialog.title")}</label>
          <input
            id={`${id}-title`}
            value={values.title}
            onChange={(event) => setField("title", event.target.value)}
            required
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-description`}>
            {t("taskDialog.description")}
          </label>
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
            <label htmlFor={`${id}-status`}>{t("taskDialog.status")}</label>
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
                  {t(`tasks.status.${status}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-priority`}>{t("taskDialog.priority")}</label>
            <select
              id={`${id}-priority`}
              value={values.priority}
              onChange={(event) =>
                setField("priority", event.target.value as TaskPriority | "")
              }
              className={fieldClass}
            >
              <option value="">{t("taskDialog.none")}</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`tasks.priority.${priority}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-assignee`}>{t("taskDialog.assignee")}</label>
            <select
              id={`${id}-assignee`}
              value={values.assigneeId}
              onChange={(event) => setField("assigneeId", event.target.value)}
              className={fieldClass}
            >
              <option value="">{t("taskDialog.unassigned")}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-due-date`}>{t("taskDialog.dueDate")}</label>
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
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isEdit ? t("taskDialog.save") : t("taskDialog.create")}
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
  const { t } = useTranslation()
  const deleteMutation = useDelete<TaskWriteData>({})

  function onConfirm() {
    if (!task) return
    deleteMutation.mutate(
      {
        resource: "tasks",
        id: task.id,
        invalidates: ["resourceAll"],
        successNotification: {
          message: t("taskDialog.deleted"),
          type: "success",
        },
        errorNotification: (error?: HttpError) => ({
          message: t("taskDialog.failedDelete"),
          type: "error",
          description: describeError(error),
        }),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal open={open} title={t("taskDialog.deleteTitle")} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        {t("taskDialog.deleteBody", { title: task?.title ?? "" })}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={deleteMutation.mutation.isPending}
          onClick={onConfirm}
        >
          {t("common.delete")}
        </Button>
      </div>
    </Modal>
  )
}
