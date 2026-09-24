const MIN_BOARD_SIZE = 5;
const MAX_BOARD_SIZE = 12;
const CELL_SIZE_TOLERANCE = 0.12;
const ROW_ALIGNMENT_TOLERANCE = 0.15;
const GRID_ALIGNMENT_TOLERANCE = 0.08;
const MAX_SPACING_TO_WIDTH_RATIO = 1.4;

/** Return cells arranged by row and column, or null if no square grid is found. */
export function findSquareGrid(candidateCells) {
  for (const anchorCell of candidateCells) {
    const similarCells = candidateCells.filter((cell) => {
      return (
        Math.abs(cell.width - anchorCell.width) <
          anchorCell.width * CELL_SIZE_TOLERANCE &&
        Math.abs(cell.height - anchorCell.height) <
          anchorCell.height * CELL_SIZE_TOLERANCE
      );
    });
    const rows = groupCellsIntoRows(similarCells, anchorCell.height);

    for (let boardSize = MIN_BOARD_SIZE; boardSize <= MAX_BOARD_SIZE; boardSize++) {
      const matchingRows = rows.filter((row) => row.length === boardSize);

      for (let offset = 0; offset <= matchingRows.length - boardSize; offset++) {
        const grid = matchingRows.slice(offset, offset + boardSize);
        if (isRegularSquareGrid(grid, anchorCell.width)) {
          return grid;
        }
      }
    }
  }

  return null;
}

function groupCellsIntoRows(cells, cellHeight) {
  const rows = [];
  cells.sort((first, second) => first.y - second.y || first.x - second.x);

  for (const cell of cells) {
    let matchingRow = rows.find((row) => {
      return Math.abs(row[0].y - cell.y) < cellHeight * ROW_ALIGNMENT_TOLERANCE;
    });

    if (!matchingRow) {
      matchingRow = [];
      rows.push(matchingRow);
    }
    matchingRow.push(cell);
  }

  for (const row of rows) {
    row.sort((first, second) => first.x - second.x);
  }

  return rows;
}

function isRegularSquareGrid(grid, cellWidth) {
  const origin = grid[0][0];
  const spacing = grid[0][1].x - origin.x;
  if (spacing < cellWidth || spacing > cellWidth * MAX_SPACING_TO_WIDTH_RATIO) {
    return false;
  }

  // Use one spacing for both axes: the board must be a square lattice.
  const tolerance = spacing * GRID_ALIGNMENT_TOLERANCE;
  return grid.every((row, rowIndex) => {
    return row.every((cell, columnIndex) => {
      const expectedX = origin.x + columnIndex * spacing;
      const expectedY = origin.y + rowIndex * spacing;
      return (
        Math.abs(cell.x - expectedX) < tolerance &&
        Math.abs(cell.y - expectedY) < tolerance
      );
    });
  });
}
