import { expect, test, type Page } from "@playwright/test"

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test("theme toggle switches dark and persists across reload", async ({
  page,
}) => {
  await login(page, "admin@example.com", "adminpass")
  await page.goto("/dashboard/settings")

  await page.getByRole("button", { name: "Dark" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
})

test("locale switch translates the interface and persists", async ({ page }) => {
  await login(page, "admin@example.com", "adminpass")
  await page.goto("/dashboard/settings")

  // English by default.
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible()

  await page.getByRole("button", { name: "Tiếng Việt" }).click()
  await expect(page.getByRole("heading", { name: "Cài đặt" })).toBeVisible()

  await page.reload()
  await expect(page.getByRole("heading", { name: "Cài đặt" })).toBeVisible()
})

test("currency formats as USD for English and zero-decimal VND for Vietnamese", async ({
  page,
}) => {
  await login(page, "admin@example.com", "adminpass")
  await page.goto("/dashboard/settings")

  await expect(page.getByText(/\$1,234,567\.89/)).toBeVisible()

  await page.getByRole("button", { name: "Tiếng Việt" }).click()
  await expect(page.getByText(/1\.234\.568\s*₫/)).toBeVisible()
})

test("updating the password invalidates the old password", async ({ page }) => {
  await login(page, "member@example.com", "memberpass")
  await page.goto("/dashboard/settings")

  await page.getByLabel("Current password").fill("memberpass")
  await page.getByLabel("New password").fill("newpass123")
  await page.getByRole("button", { name: "Update password" }).click()
  await expect(page.getByText("Password updated")).toBeVisible()

  // The old password no longer works as the current password.
  await page.getByLabel("Current password").fill("memberpass")
  await page.getByLabel("New password").fill("another123")
  await page.getByRole("button", { name: "Update password" }).click()
  await expect(page.getByText("Failed to update password")).toBeVisible()

  // The new password works.
  await page.getByLabel("Current password").fill("newpass123")
  await page.getByLabel("New password").fill("finalpass123")
  await page.getByRole("button", { name: "Update password" }).click()
  await expect(page.getByText("Password updated")).toBeVisible()
})
