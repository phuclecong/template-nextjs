"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"
import { useLogin } from "@refinedev/core"
import { useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export function LoginForm() {
  const { t } = useTranslation()
  const { mutate: login, isPending } = useLogin<{
    email: string
    password: string
  }>()
  const [error, setError] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t("validation.email")),
        password: z.string().min(1, t("validation.required")),
      }),
    [t]
  )

  type LoginValues = z.infer<typeof schema>

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: LoginValues) {
    setError(null)
    login(values, {
      onSuccess: (result) => {
        if (!result.success) {
          setError(
            result.error instanceof Error
              ? result.error.message
              : t("login.failed")
          )
          return
        }
        window.location.assign(result.redirectTo ?? "/dashboard")
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : t("login.failed"))
      },
    })
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full max-w-sm flex-col gap-4 text-sm"
      >
        <h1 className="text-lg font-medium">{t("login.title")}</h1>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("login.email")}</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {t("login.password")}
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
