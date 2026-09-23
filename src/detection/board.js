import { findCandidateCells } from './cells.js';
import { findSquareGrid } from './grid.js';
import { readCellColors } from './colors.js';

/**
 * Convert image pixels into the solver's color matrix and overlay coordinates.
 * Cell x/y values are centers in the input image; width/height use the same units.
 */
export function detectBoard(imageData) {
  const candidateCells = findCandidateCells(imageData);
  const grid = findSquareGrid(candidateCells);

  if (!grid) {
    throw new Error(
      'Could not read the board. Choose a clear, untouched screenshot with the whole grid visible.',
    );
  }

  const boardSize = grid.length;
  const { colors, palette } = readCellColors(imageData, grid);

  if (palette.length !== boardSize) {
    throw new Error(
      `Found a ${boardSize} × ${boardSize} grid, but ${palette.length} colors. Try an untouched screenshot.`,
    );
  }

  return { size: boardSize, colors, cells: grid, palette };
}
