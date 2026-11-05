"use client"

import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  useCreate,
  useDelete,
  useUpdate,
  type HttpError,
} from "@refinedev/core"
import type { TaskPriority, TaskStatus } from "@workspace/api/collections"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import { Field } from "@workspace/ui/components/form"
import { Input, Textarea } from "@workspace/ui/components/input"
import { Select } from "@workspace/ui/components/select"
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
      message: isEdit
        ? t("taskDialog.failedUpdate")
        : t("taskDialog.failedCreate"),
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
    <Dialog
      open={open}
      title={isEdit ? t("taskDialog.editTitle") : t("taskDialog.newTitle")}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field label={t("taskDialog.title")} htmlFor={`${id}-title`}>
          <Input
            id={`${id}-title`}
            value={values.title}
            onChange={(event) => setField("title", event.target.value)}
            required
          />
        </Field>

        <Field
          label={t("taskDialog.description")}
          htmlFor={`${id}-description`}
        >
          <Textarea
            id={`${id}-description`}
            value={values.description}
            onChange={(event) => setField("description", event.target.value)}
            rows={3}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("taskDialog.status")} htmlFor={`${id}-status`}>
            <Select
              id={`${id}-status`}
              value={values.status}
              onChange={(event) =>
                setField("status", event.target.value as TaskStatus)
              }
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {t(`tasks.status.${status}`)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("taskDialog.priority")} htmlFor={`${id}-priority`}>
            <Select
              id={`${id}-priority`}
              value={values.priority}
              onChange={(event) =>
                setField("priority", event.target.value as TaskPriority | "")
              }
            >
              <option value="">{t("taskDialog.none")}</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`tasks.priority.${priority}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("taskDialog.assignee")} htmlFor={`${id}-assignee`}>
            <Select
              id={`${id}-assignee`}
              value={values.assigneeId}
              onChange={(event) => setField("assigneeId", event.target.value)}
            >
              <option value="">{t("taskDialog.unassigned")}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("taskDialog.dueDate")} htmlFor={`${id}-due-date`}>
            <Input
              id={`${id}-due-date`}
              type="date"
              value={values.dueDate}
              onChange={(event) => setField("dueDate", event.target.value)}
            />
          </Field>
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
    </Dialog>
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
    <Dialog open={open} title={t("taskDialog.deleteTitle")} onClose={onClose}>
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
    </Dialog>
  )
}
