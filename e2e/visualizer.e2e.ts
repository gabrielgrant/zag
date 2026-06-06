import { expect, test } from "@playwright/test"

test.describe("visualizer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/menu/basic")
  })

  test("switches tabs and renders machine state", async ({ page }) => {
    await page.getByRole("button", { name: "Visualizer" }).click()

    await expect(page.locator(".toolbar nav > button", { hasText: "Visualizer" }).first()).toHaveAttribute(
      "data-active",
      "",
    )
    await expect(page.locator(".viz").first()).toContainText("idle")
  })
})
