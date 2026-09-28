/**
 * Return zero-based cat columns, ordered from top row to bottom, or null.
 * A permutation already guarantees one cat per row and per column.
 */
export function solve(colorMatrix, fixedCats = []) {
  const boardSize = colorMatrix.length;
  validateFixedCats(colorMatrix, fixedCats);
  const columnsByRow = Array.from({ length: boardSize }, (_, index) => index);

  do {
    if (
      fixedCats.every(({ row, column }) => columnsByRow[row] === column) &&
      hasNoTouchingCats(columnsByRow) &&
      usesEachColorOnce(columnsByRow, colorMatrix)
    ) {
      return [...columnsByRow];
    }
  } while (advanceToNextPermutation(columnsByRow));

  return null;
}

function validateFixedCats(colorMatrix, fixedCats) {
  for (let index = 0; index < fixedCats.length; index++) {
    const cat = fixedCats[index];
    if (
      !Number.isInteger(cat.row) ||
      !Number.isInteger(cat.column) ||
      cat.row < 0 ||
      cat.row >= colorMatrix.length ||
      cat.column < 0 ||
      cat.column >= colorMatrix.length
    ) {
      throw new Error('A fixed cat is outside the board.');
    }
    for (const previous of fixedCats.slice(0, index)) {
      if (
        cat.row === previous.row ||
        cat.column === previous.column ||
        colorMatrix[cat.row][cat.column] === colorMatrix[previous.row][previous.column] ||
        (Math.abs(cat.row - previous.row) <= 1 &&
          Math.abs(cat.column - previous.column) <= 1)
      ) {
        throw new Error(
          'Detected cats conflict with the game rules. Try a clearer screenshot.',
        );
      }
    }
  }
}

// Helpers are private to this module: only solve() is exported.
function hasNoTouchingCats(columnsByRow) {
  return columnsByRow.every((column, row) => {
    return row === 0 || Math.abs(column - columnsByRow[row - 1]) >= 2;
  });
}

function usesEachColorOnce(columnsByRow, colorMatrix) {
  const selectedColors = columnsByRow.map((column, row) => colorMatrix[row][column]);
  return new Set(selectedColors).size === columnsByRow.length;
}

/**
 * Mutate the array to its next lexicographic permutation.
 * Return false when the current permutation is the final one.
 */
function advanceToNextPermutation(permutation) {
  // Find the rightmost value that can increase. Everything after it is descending.
  let pivotIndex = permutation.length - 2;
  while (pivotIndex >= 0 && permutation[pivotIndex] >= permutation[pivotIndex + 1]) {
    pivotIndex--;
  }

  if (pivotIndex < 0) {
    return false;
  }

  // In the descending suffix, the rightmost larger value is the smallest increase.
  let swapIndex = permutation.length - 1;
  while (permutation[swapIndex] <= permutation[pivotIndex]) {
    swapIndex--;
  }

  [permutation[pivotIndex], permutation[swapIndex]] = [
    permutation[swapIndex],
    permutation[pivotIndex],
  ];

  // The suffix is still descending after the swap. Reverse it to get the
  // smallest suffix, making this the immediately next permutation.
  reverseSuffix(permutation, pivotIndex + 1);
  return true;
}

function reverseSuffix(values, startIndex) {
  let leftIndex = startIndex;
  let rightIndex = values.length - 1;

  while (leftIndex < rightIndex) {
    [values[leftIndex], values[rightIndex]] = [values[rightIndex], values[leftIndex]];
    leftIndex++;
    rightIndex--;
  }
}
