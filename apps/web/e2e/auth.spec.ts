import { expect, test } from "@playwright/test"

test("register → login → logout", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`
  const password = "secret123"

  // Register creates the account and lands on the protected shell.
  await page.goto("/register")
  await page.getByLabel("Name").fill("E2E User")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Register" }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  // Session survives a reload.
  await page.reload()
  await expect(page).toHaveURL(/\/dashboard/)

  // Logout ends the session and redirects to login.
  await page.getByRole("button", { name: "Sign out" }).click()
  await expect(page).toHaveURL(/\/login/)

  // Login with the new credentials.
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  // An authenticated visitor on the login page is bounced to the dashboard.
  await page.goto("/login")
  await expect(page).toHaveURL(/\/dashboard/)
})
