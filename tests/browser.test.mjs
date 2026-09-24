import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startTestServer } from './helpers/server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const screenshotNames = ['IMG_4186.png', 'second_level.png', '12x12.png'];
const viewports = [
  { width: 1280, height: 1000 },
  { width: 390, height: 844 },
];

test('desktop and mobile viewport upload-to-overlay flow', async (testContext) => {
  const baseUrl = await startTestServer(testContext);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  testContext.after(() => browser.close());
  mkdirSync('test-results', { recursive: true });

  const page = await browser.newPage();
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(baseUrl);
    assert.equal(await page.locator('#solve').isDisabled(), true);

    for (const screenshotName of screenshotNames) {
      await selectAndSolve(page, screenshotName);
      const boardSize = screenshotName === '12x12.png' ? 12 : 8;
      assert.match(
        await page.locator('#status').innerText(),
        new RegExp(`Solved ${boardSize} × ${boardSize}`),
      );

      if (screenshotName === screenshotNames[0]) {
        const accessibleSolution = await page
          .locator('#preview')
          .getAttribute('aria-label');
        assert.match(accessibleSolution, /4, 8, 5, 3, 6, 2, 7, 1/);
      }

      if (screenshotName === '12x12.png') {
        const accessibleSolution = await page
          .locator('#preview')
          .getAttribute('aria-label');
        assert.match(accessibleSolution, /3, 5, 12, 6, 8, 11, 1, 9, 2, 7, 10, 4/);
      }

      const fitsViewport = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      assert.equal(fitsViewport, true);

      await page.screenshot({
        path: `test-results/${viewport.width}-${screenshotName}`,
        fullPage: true,
      });
    }

    await verifyInvalidImageError(page);
  }

  assert.deepEqual(browserErrors, []);
});

async function selectAndSolve(page, screenshotName) {
  await page.locator('#photo').setInputFiles(`screenshots/${screenshotName}`);
  await page.waitForFunction(() => !document.querySelector('#solve').disabled);
  assert.equal(await page.locator('#preview').isVisible(), true);

  await page.locator('#solve').click();
  await page.waitForFunction(() => {
    return document.querySelector('#status').textContent.startsWith('Solved');
  });
}

async function verifyInvalidImageError(page) {
  await page.locator('#photo').setInputFiles({
    name: 'broken.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not an image'),
  });
  await page.waitForFunction(() => {
    return document.querySelector('#status').classList.contains('error');
  });
  assert.equal(await page.locator('#solve').isDisabled(), true);
}
