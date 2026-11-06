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

test("admin creates, edits, and deletes a task", async ({ page }) => {
  await login(page, "admin@example.com", "adminpass")
  await openTasks(page)

  // Create a task with every field populated.
  await page.getByRole("button", { name: "New task" }).click()
  const createDialog = page.getByRole("dialog")
  await expect(createDialog).toBeVisible()
  await createDialog.getByLabel("Title").fill("E2E write task")
  await createDialog.getByLabel("Description").fill("created by the write-path spec")
  await createDialog.getByLabel("Status").click()
  await page.getByRole("option", { name: "done" }).click()
  await createDialog.getByLabel("Priority").click()
  await page.getByRole("option", { name: "high" }).click()
  await createDialog.getByLabel("Assignee").click()
  await page.getByRole("option", { name: "Mia Member" }).click()
  await createDialog.getByLabel("Due date").fill("2026-12-31")
  await createDialog.getByRole("button", { name: "Create task" }).click()

  await expect(page.getByText("Task created")).toBeVisible()

  // Isolate the new row and confirm the fields persisted.
  await page.getByLabel("Search tasks").fill("E2E write task")
  const createdRow = page.getByRole("row").filter({ hasText: "E2E write task" })
  await expect(createdRow).toBeVisible()
  await expect(createdRow.getByText("done", { exact: true })).toBeVisible()
  await expect(createdRow.getByText("high", { exact: true })).toBeVisible()

  // Edit the title; the change persists.
  await createdRow.getByRole("button", { name: "Edit" }).click()
  const editDialog = page.getByRole("dialog")
  await expect(editDialog).toBeVisible()
  await editDialog.getByLabel("Title").fill("E2E write task renamed")
  await editDialog.getByRole("button", { name: "Save changes" }).click()

  await expect(page.getByText("Task updated")).toBeVisible()
  const renamedRow = page
    .getByRole("row")
    .filter({ hasText: "E2E write task renamed" })
  await expect(renamedRow).toBeVisible()

  // Delete the task; it disappears.
  await renamedRow.getByRole("button", { name: "Delete" }).click()
  const deleteDialog = page.getByRole("dialog")
  await expect(deleteDialog).toBeVisible()
  await deleteDialog.getByRole("button", { name: "Delete" }).click()

  await expect(page.getByText("Task deleted")).toBeVisible()
  await expect(page.getByText("E2E write task renamed")).toHaveCount(0)
})

test("member can edit/delete only their own tasks", async ({ page }) => {
  await login(page, "member@example.com", "memberpass")
  await openTasks(page)

  // "Build the MSW mock" is seeded to the member; actions are enabled.
  await page.getByLabel("Search tasks").fill("Build the MSW mock")
  const ownRow = page.getByRole("row").filter({ hasText: "Build the MSW mock" })
  await expect(ownRow).toBeVisible()
  await expect(ownRow.getByRole("button", { name: "Edit" })).toBeEnabled()
  await expect(ownRow.getByRole("button", { name: "Delete" })).toBeEnabled()

  // "Author the OpenAPI contract" belongs to the admin; actions are disabled.
  await page.getByLabel("Search tasks").fill("Author the OpenAPI contract")
  const adminRow = page
    .getByRole("row")
    .filter({ hasText: "Author the OpenAPI contract" })
  await expect(adminRow).toBeVisible()
  await expect(adminRow.getByRole("button", { name: "Edit" })).toBeDisabled()
  await expect(adminRow.getByRole("button", { name: "Delete" })).toBeDisabled()
})
