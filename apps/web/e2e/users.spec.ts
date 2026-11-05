import { expect, test, type Page } from "@playwright/test"

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

async function openUsers(page: Page) {
  await page.getByRole("link", { name: "Users" }).click()
  await expect(page).toHaveURL(/\/dashboard\/users/)
  await expect(page.getByRole("table")).toBeVisible()
}

test("admin changes a user's role and deletes a user", async ({ page }) => {
  await login(page, "admin@example.com", "adminpass")
  await openUsers(page)

  // Both seeded users render.
  await expect(page.getByText("Ada Admin")).toBeVisible()
  await expect(page.getByText("Mia Member")).toBeVisible()

  // Promote Mia Member to admin; the role select reflects the change.
  await page.getByLabel("Role for Mia Member").selectOption("admin")
  await expect(page.getByText("Role updated")).toBeVisible()
  await expect(page.getByLabel("Role for Mia Member")).toHaveValue("admin")

  // Delete Mia Member.
  const miaRow = page.getByRole("row").filter({ hasText: "Mia Member" })
  await miaRow.getByRole("button", { name: "Delete" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Delete" }).click()

  await expect(page.getByText("User deleted")).toBeVisible()
  await expect(page.getByText("Mia Member")).toHaveCount(0)
})

test("member sees the users list read-only", async ({ page }) => {
  await login(page, "member@example.com", "memberpass")
  await openUsers(page)

  // The list renders for a member…
  await expect(page.getByText("Ada Admin")).toBeVisible()
  await expect(page.getByText("Mia Member")).toBeVisible()

  // …but role changes and deletes are hidden.
  await expect(page.getByLabel("Role for Mia Member")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0)
})
