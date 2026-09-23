/** Draw solution circles in original-image coordinates, not CSS display pixels. */
export function drawSolution(context, board, solution, detectionScale) {
  for (let rowIndex = 0; rowIndex < board.size; rowIndex++) {
    const columnIndex = solution[rowIndex];
    const cell = board.cells[rowIndex][columnIndex];
    drawCircle(context, cell, detectionScale);
  }
}

function drawCircle(context, cell, detectionScale) {
  const centerX = cell.x / detectionScale;
  const centerY = cell.y / detectionScale;
  const cellWidth = cell.width / detectionScale;
  const radius = cellWidth * 0.28;

  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);

  // A white stroke inside a wider dark stroke stays visible on every region.
  context.strokeStyle = '#20332a';
  context.lineWidth = cellWidth * 0.095;
  context.stroke();

  context.strokeStyle = '#fff';
  context.lineWidth = cellWidth * 0.045;
  context.stroke();
}
