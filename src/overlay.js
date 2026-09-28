/** Mark only new placements, preserving the game's existing cat artwork. */
export function drawSolution(context, board, solution, detectionScale) {
  for (let rowIndex = 0; rowIndex < board.size; rowIndex++) {
    const columnIndex = solution[rowIndex];
    if (
      board.fixedCats.some(
        ({ row, column }) => row === rowIndex && column === columnIndex,
      )
    ) {
      continue;
    }
    const cell = board.cells[rowIndex][columnIndex];
    drawCatSilhouette(context, cell, detectionScale);
  }
}

function drawCatSilhouette(context, cell, detectionScale) {
  const centerX = cell.x / detectionScale;
  const centerY = cell.y / detectionScale;
  const cellWidth = cell.width / detectionScale;
  context.save();
  context.translate(centerX, centerY);
  context.scale(cellWidth, cell.height / detectionScale);
  // Cell-relative coordinates keep the ears and outline readable at every size.
  context.beginPath();
  context.moveTo(-0.34, -0.05);
  context.lineTo(-0.34, -0.36);
  context.quadraticCurveTo(-0.33, -0.4, -0.29, -0.37);
  context.lineTo(-0.14, -0.23);
  context.quadraticCurveTo(0, -0.28, 0.14, -0.23);
  context.lineTo(0.29, -0.37);
  context.quadraticCurveTo(0.33, -0.4, 0.34, -0.36);
  context.lineTo(0.34, -0.05);
  context.bezierCurveTo(0.49, 0.32, 0.23, 0.38, 0, 0.38);
  context.bezierCurveTo(-0.23, 0.38, -0.49, 0.32, -0.34, -0.05);
  context.closePath();
  context.fillStyle = '#ffffff';
  context.strokeStyle = '#000000';
  context.lineWidth = 0.045;
  context.lineJoin = 'round';
  context.fill();
  context.stroke();
  context.restore();
}
