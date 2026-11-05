"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"
import { useRegister } from "@refinedev/core"
import { useState } from "react"
import type { FormEvent } from "react"
import { Button } from "@workspace/ui/components/button"
import { Field } from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"

export function RegisterForm() {
  const { t } = useTranslation()
  const { mutate: register, isPending } = useRegister<{
    name: string
    email: string
    password: string
  }>()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)
    register(
      {
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      },
      {
        onSuccess: (result) => {
          if (!result.success) {
            setError(
              result.error instanceof Error
                ? result.error.message
                : t("register.failed")
            )
            return
          }
          window.location.assign(result.redirectTo ?? "/dashboard")
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : t("register.failed"))
        },
      }
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 text-sm"
      >
        <h1 className="text-lg font-medium">{t("register.title")}</h1>
        <Field label={t("register.name")} htmlFor="name">
          <Input id="name" name="name" required autoComplete="name" />
        </Field>
        <Field label={t("register.email")} htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </Field>
        <Field label={t("register.password")} htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />
        </Field>
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={isPending}>
          {t("register.submit")}
        </Button>
        <p className="text-muted-foreground">
          {t("register.haveAccount")}{" "}
          <Link href="/login" className="text-primary underline">
            {t("register.signIn")}
          </Link>
        </p>
      </form>
    </main>
  )
}
