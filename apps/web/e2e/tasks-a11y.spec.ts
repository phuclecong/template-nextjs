import { expect, test, type Page } from "@playwright/test"

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

async function openTasks(page: Page) {
  await page.getByRole("link", { name: "Tasks" }).click()
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
  // Toggling cycles ascending → descending → none.
  await titleHeader.getByRole("button").press("Enter")
  await expect(titleHeader).toHaveAttribute("aria-sort", "descending")

  await titleHeader.getByRole("button").press("Enter")
  await expect(titleHeader).toHaveAttribute("aria-sort", "none")

  await titleHeader.getByRole("button").press("Enter")
  await expect(titleHeader).toHaveAttribute("aria-sort", "ascending")
})

test("search suggestions are keyboard navigable with focus staying on the input", async ({
  page,
}) => {
  await login(page, "admin@example.com", "adminpass")
  await openTasks(page)

  const combobox = page.getByRole("combobox", { name: "Search tasks" })
  await combobox.fill("release")

  const listbox = page.getByRole("listbox", { name: "Title suggestions" })
  await expect(listbox).toBeVisible()
  await expect(combobox).toHaveAttribute("aria-expanded", "true")

  // ArrowDown activates the first option without moving focus off the input.
  await combobox.press("ArrowDown")
  await expect(combobox).toBeFocused()
  await expect(combobox).toHaveAttribute("aria-activedescendant", /-option-0$/)

  // Enter commits the active option.
  await combobox.press("Enter")
  await expect(combobox).toHaveValue(/release/)
  await expect(combobox).toHaveAttribute("aria-expanded", "false")
})
