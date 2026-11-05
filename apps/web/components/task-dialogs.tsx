"use client"

import { useId, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  useCreate,
  useDelete,
  useUpdate,
  type HttpError,
} from "@refinedev/core"
import {
  taskPrioritySchema,
  taskStatusSchema,
  type TaskPriority,
  type TaskStatus,
} from "@workspace/api/collections"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
  const id = useId()

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t("validation.required")),
        description: z.string(),
        status: taskStatusSchema,
        priority: z.union([taskPrioritySchema, z.literal("")]),
        assigneeId: z.string(),
        dueDate: z.string(),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(task),
  })

  const createMutation = useCreate<TaskWriteData, HttpError, TaskPayload>({
    resource: "tasks",
  })
  const updateMutation = useUpdate<TaskWriteData, HttpError, TaskPayload>({
    resource: "tasks",
  })

  const isPending = isEdit
    ? updateMutation.mutation.isPending
    : createMutation.mutation.isPending

  function onSubmit(values: z.infer<typeof schema>) {
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
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-title`}>
                {t("taskDialog.title")}
              </FieldLabel>
              <Input
                {...field}
                id={`${id}-title`}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-description`}>
                {t("taskDialog.description")}
              </FieldLabel>
              <Textarea
                {...field}
                id={`${id}-description`}
                rows={3}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="status"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-status`}>
                  {t("taskDialog.status")}
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger
                    id={`${id}-status`}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`tasks.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="priority"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-priority`}>
                  {t("taskDialog.priority")}
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger
                    id={`${id}-priority`}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("taskDialog.none")}</SelectItem>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {t(`tasks.priority.${priority}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="assigneeId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-assignee`}>
                  {t("taskDialog.assignee")}
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger
                    id={`${id}-assignee`}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      {t("taskDialog.unassigned")}
                    </SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="dueDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-due-date`}>
                  {t("taskDialog.dueDate")}
                </FieldLabel>
                <Input
                  {...field}
                  id={`${id}-due-date`}
                  type="date"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
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
