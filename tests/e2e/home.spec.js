const { test, expect } = require('@playwright/test');
test('home page loads', async ({ page }) => { await page.goto(process.env.BASE_URL || 'http://127.0.0.1:3000'); await expect(page).toHaveTitle(/EduAI|Voice AI/i); });
