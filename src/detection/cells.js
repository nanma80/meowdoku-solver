// Thresholds describe the supplied game's flat-colored, nearly square cells.
const MIN_CHANNEL_SPREAD = 35;
const MAX_DARKEST_CHANNEL = 235;
const MIN_CELL_WIDTH_RATIO = 0.035;
const MAX_CELL_WIDTH_RATIO = 0.23;
const MIN_ASPECT_RATIO = 0.85;
const MAX_ASPECT_RATIO = 1.15;
const MIN_COLOR_COVERAGE = 0.85;

/** Find solid colored components separated by the board's white gutters. */
export function findCandidateCells(imageData) {
  const { width, height } = imageData;
  const coloredPixels = createColorMask(imageData);
  const floodFillQueue = new Int32Array(width * height);
  const cells = [];

  for (let pixelIndex = 0; pixelIndex < coloredPixels.length; pixelIndex++) {
    if (!coloredPixels[pixelIndex]) {
      continue;
    }

    const component = collectComponent(
      pixelIndex,
      coloredPixels,
      floodFillQueue,
      width,
      height,
    );

    if (looksLikeCell(component, width)) {
      cells.push({
        x: (component.minX + component.maxX) / 2,
        y: (component.minY + component.maxY) / 2,
        width: component.width,
        height: component.height,
      });
    }
  }

  return cells;
}

function createColorMask({ data, width, height }) {
  const mask = new Uint8Array(width * height);

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex++) {
    const offset = pixelIndex * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const lightestChannel = Math.max(red, green, blue);
    const darkestChannel = Math.min(red, green, blue);

    mask[pixelIndex] =
      lightestChannel - darkestChannel > MIN_CHANNEL_SPREAD &&
      darkestChannel < MAX_DARKEST_CHANNEL
        ? 1
        : 0;
  }

  return mask;
}

// Flood fill consumes the mask, so every colored pixel is visited only once.
function collectComponent(startIndex, mask, queue, imageWidth, imageHeight) {
  let readIndex = 0;
  let writeIndex = 1;
  let minX = imageWidth;
  let maxX = 0;
  let minY = imageHeight;
  let maxY = 0;

  queue[0] = startIndex;
  mask[startIndex] = 0;

  while (readIndex < writeIndex) {
    const pixelIndex = queue[readIndex++];
    const x = pixelIndex % imageWidth;
    const y = Math.floor(pixelIndex / imageWidth);

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    const neighbors = [
      x > 0 ? pixelIndex - 1 : -1,
      x < imageWidth - 1 ? pixelIndex + 1 : -1,
      y > 0 ? pixelIndex - imageWidth : -1,
      y < imageHeight - 1 ? pixelIndex + imageWidth : -1,
    ];

    for (const neighborIndex of neighbors) {
      if (neighborIndex >= 0 && mask[neighborIndex]) {
        mask[neighborIndex] = 0;
        queue[writeIndex++] = neighborIndex;
      }
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    pixelCount: writeIndex,
  };
}

function looksLikeCell(component, imageWidth) {
  const { width, height, pixelCount } = component;
  const aspectRatio = height / width;
  const colorCoverage = pixelCount / (width * height);

  return (
    width > imageWidth * MIN_CELL_WIDTH_RATIO &&
    width < imageWidth * MAX_CELL_WIDTH_RATIO &&
    aspectRatio > MIN_ASPECT_RATIO &&
    aspectRatio < MAX_ASPECT_RATIO &&
    colorCoverage > MIN_COLOR_COVERAGE
  );
}
