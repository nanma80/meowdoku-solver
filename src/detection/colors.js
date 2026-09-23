const SAMPLE_RADIUS = 2;
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
  const channels = [[], [], []];
  const centerX = Math.round(cell.x);
  const centerY = Math.round(cell.y);

  // A median over a 5×5 patch avoids relying on a single noisy pixel.
  for (let offsetY = -SAMPLE_RADIUS; offsetY <= SAMPLE_RADIUS; offsetY++) {
    for (let offsetX = -SAMPLE_RADIUS; offsetX <= SAMPLE_RADIUS; offsetX++) {
      const pixelOffset = 4 * ((centerY + offsetY) * width + centerX + offsetX);
      for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        channels[channelIndex].push(data[pixelOffset + channelIndex]);
      }
    }
  }

  return channels.map((values) => {
    values.sort((first, second) => first - second);
    return values[Math.floor(values.length / 2)];
  });
}

function colorDistance(firstColor, secondColor) {
  const differences = firstColor.map((channel, index) => channel - secondColor[index]);
  return Math.hypot(...differences);
}
