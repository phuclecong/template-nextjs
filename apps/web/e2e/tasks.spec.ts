import { expect, test } from "@playwright/test"

test("tasks table loads and searches", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill("admin@example.com")
  await page.getByLabel("Password").fill("adminpass")
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.getByRole("link", { name: "Tasks" }).click()
  await expect(page).toHaveURL(/\/dashboard\/tasks/)

  await expect(page.getByRole("table")).toBeVisible()
  await expect(page.getByText("Author the OpenAPI contract")).toBeVisible()

  await page.getByLabel("Search tasks").fill("release")

  await expect(page.getByText(/Draft the release notes/).first()).toBeVisible()
  await expect(page.getByText("Author the OpenAPI contract")).toHaveCount(0)
  await expect(page).toHaveURL(/q=release/)
})
