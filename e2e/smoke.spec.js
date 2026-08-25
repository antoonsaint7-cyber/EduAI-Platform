const {test,expect}=require('@playwright/test');
test('landing page loads',async({page})=>{await page.goto('/');await expect(page).toHaveTitle(/مساعد صوتي|Voice AI/i);await expect(page.locator('body')).toContainText(/مساعد|VOICE AI/i);});
