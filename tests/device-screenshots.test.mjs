import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { detectBoard } from '../src/detection/board.js';
import { solve } from '../src/solver.js';
import { startTestServer } from './helpers/server.mjs';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const { chromium } = require('playwright');
const fixtures = [
  {
    filename: 'ipad-10x10-daily-0928-partial.png',
    cats: [
      [0, 8],
      [1, 6],
      [3, 2],
      [4, 5],
      [5, 7],
      [6, 3],
      [7, 1],
      [8, 4],
      [9, 9],
    ],
    solution: [8, 6, 0, 2, 5, 7, 3, 1, 4, 9],
  },
  {
    filename: 'ipad-08x08-level-051-partial.png',
    cats: [
      [0, 7],
      [1, 5],
      [2, 0],
      [3, 2],
      [4, 6],
      [5, 4],
      [7, 3],
    ],
    solution: [7, 5, 0, 2, 6, 4, 1, 3],
  },
  {
    filename: 'iphone-08x08-level-431-partial.png',
    cats: [
      [2, 2],
      [4, 1],
      [7, 5],
    ],
    solution: [0, 4, 2, 7, 1, 6, 3, 5],
  },
];

for (const { filename, cats, solution } of fixtures) {
  test(`recognize and solve real device screenshot: ${filename}`, () => {
    const image = PNG.sync.read(
      readFileSync(new URL(`../screenshots/${filename}`, import.meta.url)),
    );
    const board = detectBoard(image);
    assert.equal(board.size, solution.length);
    assert.equal(board.palette.length, solution.length);
    // Cat coordinates were independently checked against the source screenshot.
    assert.deepEqual(
      board.fixedCats,
      cats.map(([row, column]) => ({ row, column })),
    );
    assert.deepEqual(solve(board.colors, board.fixedCats), solution);
    assert.equal(new Set(solution).size, board.size);
    assert.equal(
      new Set(solution.map((column, row) => board.colors[row][column])).size,
      board.size,
    );
    assert.ok(
      solution.every(
        (column, row) => row === 0 || Math.abs(column - solution[row - 1]) >= 2,
      ),
    );
  });
}

test('real device screenshots work through browser resizing, worker, and overlay', async (context) => {
  const baseUrl = await startTestServer(context);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  context.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 820, height: 1180 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(baseUrl);
  for (const { filename, cats, solution } of fixtures) {
    await page.locator('#photo').setInputFiles(`screenshots/${filename}`);
    await page.waitForFunction(() => !document.querySelector('#solve').disabled);
    await page.locator('#solve').click();
    await page.waitForFunction(() => !document.querySelector('#solve').disabled);
    assert.equal(
      await page.locator('#status').innerText(),
      `Solved ${solution.length} × ${solution.length} · Place a cat on each white silhouette. ${cats.length} existing cats preserved.`,
    );
    assert.equal(
      await page.locator('#preview').getAttribute('aria-label'),
      `Solved board. Cat columns by row: ${solution.map((column) => column + 1).join(', ')}.`,
    );
    await page
      .locator('#preview')
      .screenshot({ path: `test-results/verified-${filename}` });
  }
  assert.deepEqual(errors, []);
});
