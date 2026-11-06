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

test("sortable column header is keyboard operable and exposes aria-sort", async ({
  page,
}) => {
  await login(page, "admin@example.com", "adminpass")
  await openTasks(page)

  const titleHeader = page.getByRole("columnheader", { name: "Title" })

  // Default sort is title ascending.
  await expect(titleHeader).toHaveAttribute("aria-sort", "ascending")

  // The header is a real button, so it is focusable and Enter-operable.
  // Toggling cycles ascending → descending → ascending.
  await titleHeader.getByRole("button").press("Enter")
  await expect(titleHeader).toHaveAttribute("aria-sort", "descending")

  await titleHeader.getByRole("button").press("Enter")
  await expect(titleHeader).toHaveAttribute("aria-sort", "ascending")
})

test("selection checkboxes, filters, and pagination are labelled", async ({
  page,
}) => {
  await login(page, "admin@example.com", "adminpass")
  await openTasks(page)

  // Header select-all checkbox is labelled.
  const selectAll = page.getByRole("checkbox", { name: "Select all tasks" })
  await expect(selectAll).toBeVisible()

  // Row checkboxes are labelled with the task title.
  const row = page.getByRole("row").filter({ hasText: "Build the MSW mock" })
  await expect(
    row.getByRole("checkbox", { name: "Select Build the MSW mock" })
  ).toBeVisible()

  // Filter controls are labelled.
  await expect(page.getByLabel("Status")).toBeVisible()
  await expect(page.getByLabel("Priority")).toBeVisible()
  await expect(page.getByLabel("Assignee")).toBeVisible()

  // Pagination is labelled and the current page is announced.
  const pagination = page.getByRole("navigation", { name: "Pagination" })
  await expect(pagination).toBeVisible()
  await expect(
    pagination.getByRole("button", { name: "Page 1" })
  ).toHaveAttribute("aria-current", "page")
})
