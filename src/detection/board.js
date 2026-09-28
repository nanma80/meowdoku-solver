import { findCandidateCells } from './cells.js';
import { findSquareGrid } from './grid.js';
import { readCellColors } from './colors.js';
import { detectFixedCats } from './symbols.js';

const MARKED_CELL_MINIMUM_COVERAGE = 0.3;

/**
 * Convert image pixels into the solver's color matrix and overlay coordinates.
 * Cell x/y values are centers in the input image; width/height use the same units.
 */
export function detectBoard(imageData) {
  // Remaining solid cells can form a smaller grid inside a partially marked board.
  // Always examine both passes and prefer the grid containing more rows/columns.
  const solidGrid = findSquareGrid(findCandidateCells(imageData));
  const markedGrid = findSquareGrid(
    findCandidateCells(imageData, MARKED_CELL_MINIMUM_COVERAGE),
  );
  const grid =
    (markedGrid?.length ?? 0) > (solidGrid?.length ?? 0) ? markedGrid : solidGrid;

  if (!grid) {
    throw new Error(
      'Could not read the board. Choose a clear screenshot with the whole grid visible.',
    );
  }

  const boardSize = grid.length;
  const { colors, palette } = readCellColors(imageData, grid);

  if (palette.length !== boardSize) {
    throw new Error(
      `Found a ${boardSize} × ${boardSize} grid, but ${palette.length} colors. Try a clearer screenshot.`,
    );
  }

  const fixedCats = detectFixedCats(imageData, grid, colors, palette);
  return { size: boardSize, colors, cells: grid, palette, fixedCats };
}
