"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"
import { useLogin } from "@refinedev/core"
import { useState } from "react"
import type { FormEvent } from "react"
import { Button } from "@workspace/ui/components/button"

export function LoginForm() {
  const { t } = useTranslation()
  const { mutate: login, isPending } = useLogin<{
    email: string
    password: string
  }>()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)
    login(
      {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      },
      {
        onSuccess: (result) => {
          if (!result.success) {
            setError(
              result.error instanceof Error ? result.error.message : t("login.failed")
            )
            return
          }
          window.location.assign(result.redirectTo ?? "/dashboard")
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : t("login.failed"))
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
        <h1 className="text-lg font-medium">{t("login.title")}</h1>
        <div className="flex flex-col gap-1">
          <label htmlFor="email">{t("login.email")}</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-none border border-input bg-background px-2.5 py-1.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password">{t("login.password")}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-none border border-input bg-background px-2.5 py-1.5"
          />
        </div>
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={isPending}>
          {t("login.submit")}
        </Button>
        <p className="text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link href="/register" className="text-primary underline">
            {t("login.register")}
          </Link>
        </p>
      </form>
    </main>
  )
}
