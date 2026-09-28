import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve } from '../src/solver.js';

test('returns the first valid permutation without changing the input matrix', () => {
  const colors = Array.from({ length: 5 }, (_, row) => Array(5).fill(row));
  const originalColors = structuredClone(colors);

  assert.deepEqual(solve(colors), [0, 2, 4, 1, 3]);
  assert.deepEqual(colors, originalColors);
});

test('returns null after exhausting permutations when all cells share a color', () => {
  const colors = Array.from({ length: 5 }, () => Array(5).fill(0));
  assert.equal(solve(colors), null);
});

test('fixed cats select a different valid solution on an ambiguous board', () => {
  const colors = Array.from({ length: 5 }, (_, row) => Array(5).fill(row));
  const fixedCats = [{ row: 0, column: 1 }];
  const solution = solve(colors, fixedCats);
  assert.ok(solution);
  assert.equal(solution[0], 1);
  assert.notDeepEqual(solution, solve(colors));
});

test('rejects conflicting or out-of-range fixed cats', () => {
  const colors = Array.from({ length: 5 }, (_, row) => Array(5).fill(row));
  for (const fixedCats of [
    [
      { row: 0, column: 0 },
      { row: 0, column: 3 },
    ],
    [
      { row: 0, column: 0 },
      { row: 2, column: 0 },
    ],
    [
      { row: 0, column: 0 },
      { row: 1, column: 1 },
    ],
    [{ row: 5, column: 0 }],
  ]) {
    assert.throws(() => solve(colors, fixedCats), /conflict|outside/);
  }
  colors[2].fill(0);
  assert.throws(
    () =>
      solve(colors, [
        { row: 0, column: 0 },
        { row: 2, column: 3 },
      ]),
    /conflict/,
  );
});
