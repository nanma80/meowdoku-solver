const COLOR_DISTANCE_THRESHOLD = 9;

/** Assign a shared region ID to cells with matching background colors. */
export function readCellColors(imageData, grid) {
  const palette = [];
  const colors = grid.map((row) => {
    return row.map((cell) => {
      const cellColor = sampleCellColor(imageData, cell);
      let colorId = palette.findIndex((knownColor) => {
        return colorDistance(knownColor, cellColor) < COLOR_DISTANCE_THRESHOLD;
      });

      if (colorId < 0) {
        colorId = palette.length;
        palette.push(cellColor);
      }
      return colorId;
    });
  });

  return { colors, palette };
}

function sampleCellColor({ data, width }, cell) {
  const groups = [];
  // Sample a proportional outer band, omitting rounded corners and gutters.
  // A histogram across all four sides lets background win over a local symbol.
  for (let row = 0; row < 32; row++) {
    for (let column = 0; column < 32; column++) {
      const x = (column + 0.5) / 32 - 0.5;
      const y = (row + 0.5) / 32 - 0.5;
      const outer = Math.max(Math.abs(x), Math.abs(y));
      const inner = Math.min(Math.abs(x), Math.abs(y));
      if (outer < 0.34 || outer > 0.44 || inner > 0.3) continue;
      const offset =
        4 *
        (Math.round(cell.y + y * cell.height) * width +
          Math.round(cell.x + x * cell.width));
      const rgb = Array.from(data.slice(offset, offset + 3));
      let group = groups.find((candidate) => colorDistance(candidate.rgb, rgb) < 6);
      if (!group) {
        group = { rgb, count: 0 };
        groups.push(group);
      }
      group.count++;
    }
  }
  groups.sort((first, second) => second.count - first.count);
  return groups[0].rgb;
}

function colorDistance(firstColor, secondColor) {
  const differences = firstColor.map((channel, index) => channel - secondColor[index]);
  return Math.hypot(...differences);
}
