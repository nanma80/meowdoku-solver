import { CAT_TEMPLATES } from './cat-templates.js';

const SIGNATURE_SIZE = 24;
const BACKGROUND_DISTANCE = 24;
const MAX_CAT_DISTANCE = 0.16;

/** Normalize cell contents independently of screenshot resolution and region color. */
export function createSymbolSignature({ data, width }, cell, background) {
  let signature = '';
  for (let row = 0; row < SIGNATURE_SIZE; row++) {
    for (let column = 0; column < SIGNATURE_SIZE; column++) {
      const x = ((column + 0.5) / SIGNATURE_SIZE - 0.5) * 0.88;
      const y = ((row + 0.5) / SIGNATURE_SIZE - 0.5) * 0.88;
      const offset =
        4 *
        (Math.round(cell.y + y * cell.height) * width +
          Math.round(cell.x + x * cell.width));
      const rgb = Array.from(data.slice(offset, offset + 3));
      const distance = Math.hypot(
        ...rgb.map((channel, index) => channel - background[index]),
      );
      const brightness = Math.round((rgb[0] + rgb[1] + rgb[2]) / 3 / 17);
      signature += distance < BACKGROUND_DISTANCE ? '.' : brightness.toString(16);
    }
  }
  return signature;
}

/** X marks carry no constraints; only confidently recognized cats are fixed. */
export function detectFixedCats(imageData, grid, colors, palette) {
  const fixedCats = [];
  for (let row = 0; row < grid.length; row++) {
    for (let column = 0; column < grid.length; column++) {
      const signature = createSymbolSignature(
        imageData,
        grid[row][column],
        palette[colors[row][column]],
      );
      if (isEmptyOrCross(signature)) continue;
      const distance = Math.min(
        ...CAT_TEMPLATES.map((template) => signatureDistance(signature, template)),
      );
      if (distance > MAX_CAT_DISTANCE) {
        throw new Error(
          `Could not recognize the symbol at row ${row + 1}, column ${column + 1}. Try a clearer screenshot.`,
        );
      }
      fixedCats.push({ row, column });
    }
  }
  return fixedCats;
}

function isEmptyOrCross(signature) {
  let foregroundCount = 0;
  let diagonalCount = 0;
  for (let index = 0; index < signature.length; index++) {
    if (signature[index] === '.') continue;
    foregroundCount++;
    const x = ((index % SIGNATURE_SIZE) + 0.5) / SIGNATURE_SIZE;
    const y = (Math.floor(index / SIGNATURE_SIZE) + 0.5) / SIGNATURE_SIZE;
    if (Math.min(Math.abs(x - y), Math.abs(x + y - 1)) < 0.2) diagonalCount++;
  }
  return (
    foregroundCount < signature.length * 0.025 || diagonalCount / foregroundCount > 0.94
  );
}

function signatureDistance(signature, template) {
  let difference = 0;
  let totalWeight = 0;
  for (let index = 0; index < signature.length; index++) {
    const actual = signature[index];
    const expected = template[index];
    const x = ((index % SIGNATURE_SIZE) + 0.5) / SIGNATURE_SIZE;
    const y = (Math.floor(index / SIGNATURE_SIZE) + 0.5) / SIGNATURE_SIZE;
    // Eye direction and blinking animate. Give this band less influence than
    // the stable ears, head outline, and muzzle rather than requiring exact eyes.
    const weight = x > 0.2 && x < 0.8 && y > 0.35 && y < 0.6 ? 0.4 : 1;
    totalWeight += weight;
    if (actual === '.' || expected === '.') {
      difference += actual === expected ? 0 : weight;
    } else {
      difference +=
        (weight * Math.abs(parseInt(actual, 16) - parseInt(expected, 16))) / 15;
    }
  }
  return difference / totalWeight;
}
