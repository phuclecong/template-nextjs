"use client"

import { useMemo } from "react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"
import { useCustomMutation, type HttpError } from "@refinedev/core"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { describeError } from "@/utils/http-error"
import { formatCurrency } from "@/utils/currency"

/** A representative amount used only to demonstrate locale currency formatting. */
const SAMPLE_AMOUNT = 1234567.89

type PasswordPayload = { currentPassword: string; newPassword: string }

export function SettingsView() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  const locale = i18n.language === "vi" ? "vi" : "en"

  return (
    <div className="flex max-w-lg flex-col gap-8 p-6 text-sm">
      <h1 className="text-lg font-medium">{t("settings.title")}</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">{t("settings.theme.title")}</h2>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={theme === value ? "default" : "outline"}
              onClick={() => setTheme(value)}
            >
              {t(`settings.theme.${value}`)}
            </Button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">{t("settings.locale.title")}</h2>
        <div className="flex gap-2">
          {(["en", "vi"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={locale === value ? "default" : "outline"}
              onClick={() => void i18n.changeLanguage(value)}
            >
              {t(`settings.locale.${value}`)}
            </Button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">{t("settings.currency.title")}</h2>
        <p className="text-muted-foreground">
          {t("settings.currency.sampleLabel")}:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(SAMPLE_AMOUNT, locale)}
          </span>
        </p>
      </section>

      <ChangePasswordForm />
    </div>
  )
}

function ChangePasswordForm() {
  const { t } = useTranslation()

  const schema = useMemo(
    () =>
      z.object({
        currentPassword: z.string().min(1, t("validation.required")),
        newPassword: z.string().min(1, t("validation.required")),
      }),
    [t]
  )

  type ChangePasswordValues = z.infer<typeof schema>

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "" },
  })

  const passwordMutation = useCustomMutation<
    { id?: string },
    HttpError,
    PasswordPayload
  >({})

  function onSubmit(values: ChangePasswordValues) {
    passwordMutation.mutate(
      {
        url: "/api/password",
        method: "put",
        values,
        successNotification: {
          message: t("settings.password.success"),
          type: "success",
        },
        errorNotification: (error) => ({
          message: t("settings.password.failed"),
          type: "error",
          description: describeError(error),
        }),
      },
      {
        onSuccess: () => {
          form.reset()
        },
      }
    )
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-medium">{t("settings.password.title")}</h2>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <Controller
          control={form.control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {t("settings.password.current")}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {t("settings.password.new")}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <div>
          <Button type="submit" disabled={passwordMutation.mutation.isPending}>
            {t("settings.password.submit")}
          </Button>
        </div>
      </form>
    </section>
  )
}
