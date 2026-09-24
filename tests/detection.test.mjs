import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { detectBoard } from '../src/detection/board.js';
import { solve } from '../src/solver.js';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const fixtures = [
  { filename: 'IMG_4186.png', solution: [3, 7, 4, 2, 5, 1, 6, 0] },
  { filename: 'second_level.png', solution: [6, 1, 3, 0, 4, 2, 5, 7] },
  { filename: '12x12.png', solution: [2, 4, 11, 5, 7, 10, 0, 8, 1, 6, 9, 3] },
];

for (const { filename, solution } of fixtures) {
  test(`extract and solve ${filename}`, () => {
    const screenshotPath = new URL(`../screenshots/${filename}`, import.meta.url);
    const imageData = PNG.sync.read(readFileSync(screenshotPath));
    const board = detectBoard(imageData);

    assert.equal(board.size, solution.length);
    assert.equal(board.palette.length, solution.length);

    const actualSolution = solve(board.colors);
    assert.deepEqual(actualSolution, solution);
    assert.equal(new Set(actualSolution).size, board.size);
    assert.equal(
      new Set(actualSolution.map((column, row) => board.colors[row][column])).size,
      board.size,
    );
    assert.ok(
      actualSolution.every((column, row) => {
        return row === 0 || Math.abs(column - actualSolution[row - 1]) >= 2;
      }),
    );
  });
}

test('blank input is rejected', () => {
  const blankImage = {
    width: 100,
    height: 100,
    data: new Uint8ClampedArray(100 * 100 * 4).fill(255),
  };
  assert.throws(() => detectBoard(blankImage), /Could not read/);
});
