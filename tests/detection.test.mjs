import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { detectBoard } from '../src/detection/board.js';
import { solve } from '../src/solver.js';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const fixtures = [
  { filename: 'iphone-08x08-board-01-clean.png', solution: [3, 7, 4, 2, 5, 1, 6, 0] },
  { filename: 'iphone-08x08-level-351-clean.png', solution: [6, 1, 3, 0, 4, 2, 5, 7] },
  {
    filename: 'iphone-12x12-daily-0924-clean.png',
    solution: [2, 4, 11, 5, 7, 10, 0, 8, 1, 6, 9, 3],
  },
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

for (const cleanSectionStart of [0, 3, 7]) {
  test(`12×12 board is not truncated to a clean 5×5 section at offset ${cleanSectionStart}`, () => {
    const image = PNG.sync.read(
      readFileSync(
        new URL('../screenshots/iphone-12x12-daily-0924-clean.png', import.meta.url),
      ),
    );
    const originalBoard = detectBoard(image);
    for (let row = 0; row < 12; row++) {
      for (let column = 0; column < 12; column++) {
        const inCleanSection =
          row >= cleanSectionStart &&
          row < cleanSectionStart + 5 &&
          column >= cleanSectionStart &&
          column < cleanSectionStart + 5;
        if (inCleanSection) continue;
        drawWhiteCross(image, originalBoard.cells[row][column]);
      }
    }
    const markedBoard = detectBoard(image);
    assert.equal(markedBoard.size, 12);
    assert.deepEqual(markedBoard.colors, originalBoard.colors);
    assert.deepEqual(markedBoard.fixedCats, []);
  });
}

function drawWhiteCross(image, cell) {
  for (
    let y = Math.ceil(cell.y - cell.height * 0.32);
    y <= cell.y + cell.height * 0.32;
    y++
  ) {
    for (
      let x = Math.ceil(cell.x - cell.width * 0.32);
      x <= cell.x + cell.width * 0.32;
      x++
    ) {
      const relativeX = (x - cell.x) / cell.width;
      const relativeY = (y - cell.y) / cell.height;
      if (
        Math.min(Math.abs(relativeX - relativeY), Math.abs(relativeX + relativeY)) < 0.1
      ) {
        image.data.set([255, 255, 255, 255], 4 * (y * image.width + x));
      }
    }
  }
}
