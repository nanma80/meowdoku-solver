const MAX_DETECTION_WIDTH = 1000;

/** Decode a locally selected file without uploading it anywhere. */
export async function loadImage(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Bound detection cost while leaving even 11×11 cells large enough to sample. */
export function createDetectionImage(image) {
  const scale = Math.min(1, MAX_DETECTION_WIDTH / image.naturalWidth);
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = Math.round(image.naturalWidth * scale);
  sampleCanvas.height = Math.round(image.naturalHeight * scale);

  const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height);
  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);

  return { pixels, scale };
}
