import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { detectBoard } from '../src/detection/board.js';
import { solve } from '../src/solver.js';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
function readScreenshot(name) {
  return PNG.sync.read(readFileSync(new URL(`../screenshots/${name}`, import.meta.url)));
}

const firstCats = [
  [0, 3],
  [2, 4],
  [3, 2],
  [4, 5],
  [5, 1],
  [6, 6],
  [7, 0],
].map(([row, column]) => ({ row, column }));
const secondCats = [
  [1, 5],
  [2, 7],
  [3, 9],
  [4, 3],
  [5, 6],
  [6, 8],
  [7, 0],
].map(([row, column]) => ({ row, column }));

for (const direction of [-1, 1]) {
  test(`cat recognition tolerates an eye-band shift in direction ${direction}`, () => {
    const image = readScreenshot('iphone-10x10-level-428-partial.png');
    const board = detectBoard(image);
    const originalPixels = Buffer.from(image.data);
    for (const { row, column } of secondCats) {
      const cell = board.cells[row][column];
      const shift = Math.round(cell.width * 0.04) * direction;
      for (
        let y = Math.round(cell.y - cell.height * 0.12);
        y < cell.y + cell.height * 0.08;
        y++
      ) {
        for (
          let x = Math.round(cell.x - cell.width * 0.25);
          x < cell.x + cell.width * 0.25;
          x++
        ) {
          const source = 4 * (y * image.width + x + shift);
          image.data.set(
            originalPixels.subarray(source, source + 4),
            4 * (y * image.width + x),
          );
        }
      }
    }
    assert.deepEqual(detectBoard(image).fixedCats, secondCats);
  });
}

test('clean and marked screenshots recover exactly the same regions', () => {
  const clean = detectBoard(readScreenshot('iphone-08x08-board-01-clean.png'));
  const marked = detectBoard(readScreenshot('iphone-08x08-board-01-partial.png'));
  assert.deepEqual(marked.colors, clean.colors);
  assert.deepEqual(clean.fixedCats, []);
  assert.deepEqual(marked.fixedCats, firstCats);
  assert.deepEqual(solve(marked.colors, marked.fixedCats), [3, 7, 4, 2, 5, 1, 6, 0]);
});

test('10×10 screenshot recovers cats and colors despite white and red Xs', () => {
  const board = detectBoard(readScreenshot('iphone-10x10-level-428-partial.png'));
  assert.equal(board.size, 10);
  assert.deepEqual(board.fixedCats, secondCats);
  // Independently transcribed from the reference image, in first-seen color order.
  const expectedColors = [
    '0001100000',
    '2203114405',
    '2203144405',
    '2603377705',
    '2603777800',
    '2609977880',
    '2609888880',
    '2609988800',
    '6609988800',
    '6600000000',
  ].map((row) => [...row].map(Number));
  assert.deepEqual(board.colors, expectedColors);
  const solution = solve(board.colors, board.fixedCats);
  assert.ok(solution);
  assert.equal(new Set(solution).size, 10);
  assert.equal(
    new Set(solution.map((column, row) => board.colors[row][column])).size,
    10,
  );
  assert.ok(
    solution.every(
      (column, row) => row === 0 || Math.abs(column - solution[row - 1]) >= 2,
    ),
  );
  assert.ok(secondCats.every(({ row, column }) => solution[row] === column));
});

// Nearest-neighbor resizing exercises geometry without introducing a new test dependency.
function resizeImage(image, targetWidth) {
  const scale = targetWidth / image.width;
  const resized = new PNG({
    width: targetWidth,
    height: Math.round(image.height * scale),
  });
  for (let y = 0; y < resized.height; y++) {
    for (let x = 0; x < resized.width; x++) {
      const source =
        4 *
        (Math.min(image.height - 1, Math.floor(y / scale)) * image.width +
          Math.floor(x / scale));
      resized.data.set(
        image.data.subarray(source, source + 4),
        4 * (y * resized.width + x),
      );
    }
  }
  return resized;
}

for (const filename of [
  'iphone-08x08-board-01-partial.png',
  'iphone-10x10-level-428-partial.png',
]) {
  for (const width of [585, 1600]) {
    test(`${filename} retains regions and cats at width ${width}`, () => {
      const image = readScreenshot(filename);
      const original = detectBoard(image);
      const resized = detectBoard(resizeImage(image, width));
      assert.deepEqual(resized.colors, original.colors);
      assert.deepEqual(resized.fixedCats, original.fixedCats);
    });
  }
}

const catImage = readScreenshot('iphone-08x08-board-01-partial.png');
const catBoard = detectBoard(catImage);
const catCell = catBoard.cells[0][3];
const catBackground = catBoard.palette[catBoard.colors[0][3]];
const palette = detectBoard(readScreenshot('iphone-12x12-daily-0924-clean.png')).palette;
const crossColors = [
  [255, 255, 255],
  [250, 70, 20],
  [15, 15, 15],
  [30, 70, 240],
];

function makeMarkedGrid(size, cellSize) {
  const gutter = Math.max(3, Math.round(cellSize * 0.08));
  const margin = 20;
  const width = size * (cellSize + gutter) + margin * 2;
  const image = new PNG({ width, height: width + 80 });
  image.data.fill(255);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      for (let y = 0; y < cellSize; y++) {
        for (let x = 0; x < cellSize; x++) {
          const normalizedX = (x + 0.5) / cellSize - 0.5;
          const normalizedY = (y + 0.5) / cellSize - 0.5;
          // A rounded rectangle, with corner radius proportional to cell size.
          if (
            Math.hypot(
              Math.max(0, Math.abs(normalizedX) - 0.4),
              Math.max(0, Math.abs(normalizedY) - 0.4),
            ) > 0.1
          )
            continue;
          let rgb = palette[row];
          if (row === 0 && column === 2) {
            const sourceX = Math.round(catCell.x + normalizedX * catCell.width);
            const sourceY = Math.round(catCell.y + normalizedY * catCell.height);
            const offset = 4 * (sourceY * catImage.width + sourceX);
            const sourceColor = Array.from(catImage.data.subarray(offset, offset + 3));
            if (
              Math.hypot(
                ...sourceColor.map((value, index) => value - catBackground[index]),
              ) > 24
            )
              rgb = sourceColor;
          } else if (
            Math.max(Math.abs(normalizedX), Math.abs(normalizedY)) < 0.32 &&
            Math.min(
              Math.abs(normalizedX - normalizedY),
              Math.abs(normalizedX + normalizedY),
            ) < 0.105
          ) {
            rgb = crossColors[(row + column) % crossColors.length];
          }
          const targetX = margin + column * (cellSize + gutter) + x;
          const targetY = margin + 40 + row * (cellSize + gutter) + y;
          image.data.set([...rgb, 255], 4 * (targetY * width + targetX));
        }
      }
    }
  }
  return image;
}

test('an unfamiliar foreground symbol is reported rather than treated as a cat', () => {
  const cellSize = 55;
  const image = makeMarkedGrid(5, cellSize);
  const gutter = Math.round(cellSize * 0.08);
  const left = 20 + 2 * (cellSize + gutter);
  const top = 60;
  for (let y = 4; y < cellSize - 4; y++) {
    for (let x = 4; x < cellSize - 4; x++) {
      const rgb = x >= 10 && x < 45 && y >= 10 && y < 45 ? [0, 0, 0] : palette[0];
      image.data.set([...rgb, 255], 4 * ((top + y) * image.width + left + x));
    }
  }
  assert.throws(
    () => detectBoard(image),
    /Could not recognize the symbol at row 1, column 3/,
  );
});

for (let size = 5; size <= 12; size++) {
  for (const cellSize of [28, 55, 92]) {
    test(`rounded ${size}×${size} grid with ${cellSize}px cells and multicolor Xs`, () => {
      const board = detectBoard(makeMarkedGrid(size, cellSize));
      assert.equal(board.size, size);
      assert.deepEqual(
        board.colors,
        Array.from({ length: size }, (_, row) => Array(size).fill(row)),
      );
      assert.deepEqual(board.fixedCats, [{ row: 0, column: 2 }]);
    });
  }
}
