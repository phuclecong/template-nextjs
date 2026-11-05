"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"
import { useCustomMutation, type HttpError } from "@refinedev/core"
import { Button } from "@workspace/ui/components/button"
import { Field } from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { describeError } from "@/lib/http-error"
import { formatCurrency } from "@/lib/currency"

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
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const passwordMutation = useCustomMutation<
    { id?: string },
    HttpError,
    PasswordPayload
  >({})

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentPassword || !newPassword) return

    passwordMutation.mutate(
      {
        url: "/api/password",
        method: "put",
        values: { currentPassword, newPassword },
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
          setCurrentPassword("")
          setNewPassword("")
        },
      }
    )
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-medium">{t("settings.password.title")}</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field
          label={t("settings.password.current")}
          htmlFor="current-password"
        >
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </Field>
        <Field label={t("settings.password.new")} htmlFor="new-password">
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>
        <div>
          <Button type="submit" disabled={passwordMutation.mutation.isPending}>
            {t("settings.password.submit")}
          </Button>
        </div>
      </form>
    </section>
  )
}
