"use client"

import Link from "next/link"
import { useRegister } from "@refinedev/core"
import { useState } from "react"
import type { FormEvent } from "react"
import { Button } from "@workspace/ui/components/button"

export function RegisterForm() {
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
                : "Registration failed."
            )
            return
          }
          window.location.assign(result.redirectTo ?? "/dashboard")
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Registration failed.")
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
        <h1 className="text-lg font-medium">Register</h1>
        <div className="flex flex-col gap-1">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            className="rounded-none border border-input bg-background px-2.5 py-1.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email">Email</label>
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
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className="rounded-none border border-input bg-background px-2.5 py-1.5"
          />
        </div>
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={isPending}>
          Register
        </Button>
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  )
}
