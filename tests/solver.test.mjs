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
