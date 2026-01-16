
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('#mapCanvas');
  await page.screenshot({ path: 'verification.png' });
  await browser.close();
})();
