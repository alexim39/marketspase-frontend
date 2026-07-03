import { test, expect } from '@playwright/test';

test.describe('Campaign Creation Flow', () => {
  test('AI Builder → Create → Summary step', async ({ page }) => {
    // Navigate to AI builder
    await page.goto('http://localhost:4200/dashboard/campaigns/builder');

    // Verify builder loaded
    await expect(page.locator('h1:has-text("Create Your Campaign")')).toBeVisible();

    // Fill description
    await page.locator('textarea').fill('Custom phone cases with African prints, available in all major phone models');

    // Select goal — "Get more sales"
    await page.locator('button.goal-card').first().click();

    // Set budget to medium via slider
    const slider = page.locator('input[type="range"]');
    await slider.fill('50');

    // Verify "Generate Campaign" button is enabled
    const generateBtn = page.locator('button:has-text("Generate Campaign")');
    await expect(generateBtn).toBeEnabled();

    // Click "Skip — Manual Setup" to verify power user path
    await page.locator('button:has-text("Skip")').first().click();

    // Should land on the 5-step create form
    await expect(page.locator('text=Step 1')).toBeVisible();
    await expect(page.locator('text=Create New Campaign')).toBeVisible();
  });
});
