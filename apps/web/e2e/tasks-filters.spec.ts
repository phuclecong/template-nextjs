import { expect, test, type Page } from "@playwright/test"

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

async function openTasks(page: Page) {
  await page.locator('[data-sidebar="menu-button"]', { hasText: "Tasks" }).click()
  await expect(page).toHaveURL(/\/dashboard\/tasks/)
  await expect(page.getByRole("table")).toBeVisible()
}

test("filters the table by status", async ({ page }) => {
  await login(page, "admin@example.com", "adminpass")
  await openTasks(page)

  await expect(page.getByText("Author the OpenAPI contract")).toBeVisible()
  await expect(page.getByText("Build the MSW mock")).toBeVisible()

  await page.getByLabel("Status").click()
  await page.getByRole("option", { name: "done" }).click()

  await expect(page).toHaveURL(/status=done/)
  await expect(page.getByText("Author the OpenAPI contract")).toBeVisible()
  await expect(page.getByText("Build the MSW mock")).toHaveCount(0)
})

test("selects a row and applies a bulk status update", async ({ page }) => {
  await login(page, "admin@example.com", "adminpass")
  await openTasks(page)

  // Bulk actions are faded (disabled) until a selection is made.
  await expect(
    page.getByRole("button", { name: "Update status" })
  ).toBeDisabled()

  const row = page.getByRole("row").filter({ hasText: "Build the MSW mock" })
  await row.getByRole("checkbox").click()
  await expect(page.getByText("1 selected")).toBeVisible()

  await page.getByRole("button", { name: "Update status" }).click()
  await page.getByRole("menuitem", { name: "done" }).click()

  await expect(page.getByText("Updated 1 tasks")).toBeVisible()
})

test("paginates and reflects the page in the URL", async ({ page }) => {
  await login(page, "admin@example.com", "adminpass")
  await openTasks(page)

  const pagination = page.getByRole("navigation", { name: "Pagination" })
  await expect(pagination).toBeVisible()
  await expect(pagination.getByRole("button", { name: "Page 2" })).toBeVisible()

  await pagination.getByRole("button", { name: "Page 2" }).click()
  await expect(page).toHaveURL(/page=2/)
})

test("changes rows per page and resets to page one", async ({ page }) => {
  await login(page, "admin@example.com", "adminpass")
  await openTasks(page)

  const pagination = page.getByRole("navigation", { name: "Pagination" })
  await pagination.getByRole("button", { name: "Page 2" }).click()
  await expect(page).toHaveURL(/page=2/)

  await page.getByLabel("Rows per page").click()
  await page.getByRole("option", { name: "10", exact: true }).click()

  await expect(page).toHaveURL(/pageSize=10/)
  await expect(page).not.toHaveURL(/page=/)
})
