import { expect, test } from "@playwright/test"

import { login } from "./helpers"

test("sidebar navigates between sections", async ({ page }) => {
  await login(page, "admin@example.com", "adminpass")
  await expect(page).toHaveURL(/\/dashboard\/tasks/)

  await page.getByRole("link", { name: "Users" }).click()
  await expect(page).toHaveURL(/\/dashboard\/users/)

  await page.getByRole("link", { name: "Settings" }).click()
  await expect(page).toHaveURL(/\/dashboard\/settings/)
})

test("sidebar highlights the active page", async ({ page }) => {
  await login(page, "admin@example.com", "adminpass")
  await expect(page).toHaveURL(/\/dashboard\/tasks/)

  await expect(page.locator("[data-active]").first()).toContainText("Tasks")

  await page.getByRole("link", { name: "Users" }).click()
  await expect(page).toHaveURL(/\/dashboard\/users/)
  await expect(page.locator("[data-active]").first()).toContainText("Users")
})

test("sidebar collapses to an icon rail and persists across reload", async ({
  page,
}) => {
  await login(page, "admin@example.com", "adminpass")

  const sidebar = page.locator('[data-slot="sidebar"]')
  await expect(sidebar).toHaveAttribute("data-state", "expanded")

  await page.locator('[data-sidebar="trigger"]').click()
  await expect(sidebar).toHaveAttribute("data-state", "collapsed")

  await page.reload()
  await expect(page).toHaveURL(/\/dashboard\/tasks/)
  await expect(page.locator('[data-slot="sidebar"]')).toHaveAttribute(
    "data-state",
    "collapsed"
  )
})

test("sidebar opens as a drawer on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page, "admin@example.com", "adminpass")

  await page.locator('[data-sidebar="trigger"]').click()
  await expect(page.locator('[data-mobile="true"]')).toBeVisible()
})

test("signs out via the sidebar footer", async ({ page }) => {
  await login(page, "admin@example.com", "adminpass")
  await expect(page).toHaveURL(/\/dashboard\/tasks/)

  await page.locator('[data-sidebar="footer"]').getByRole("button").click()
  await page.getByRole("menuitem", { name: "Sign out" }).click()
  await expect(page).toHaveURL(/\/login/)
})
