import { loadImage, createDetectionImage } from './image.js';
import { drawSolution } from './overlay.js';

const photoInput = document.querySelector('#photo');
const solveButton = document.querySelector('#solve');
const previewCanvas = document.querySelector('#preview');
const previewContext = previewCanvas.getContext('2d');
const statusMessage = document.querySelector('#status');
const emptyState = document.querySelector('#empty');

let selectedImage = null;
let solverWorker = null;
let selectionVersion = 0;

photoInput.addEventListener('change', handlePhotoSelection);
solveButton.addEventListener('click', handleSolve);

async function handlePhotoSelection() {
  const currentSelectionVersion = ++selectionVersion;
  resetPreview();

  const file = photoInput.files[0];
  if (!file) {
    return;
  }

  showStatus('Opening screenshot…');

  try {
    const image = await loadImage(file);

    // A slower decode must not replace a more recently selected screenshot.
    if (currentSelectionVersion !== selectionVersion) {
      return;
    }

    selectedImage = image;
    previewCanvas.width = image.naturalWidth;
    previewCanvas.height = image.naturalHeight;
    previewContext.drawImage(image, 0, 0);
    previewCanvas.hidden = false;
    emptyState.hidden = true;
    solveButton.disabled = false;
    previewCanvas.setAttribute('aria-label', 'Selected screenshot, ready to solve');
    showStatus('Ready when you are. Tap Solve to find every cat.');
  } catch {
    if (currentSelectionVersion === selectionVersion) {
      showStatus('This image could not be opened. Try a PNG or JPEG screenshot.', true);
    }
  }
}

function handleSolve() {
  if (!selectedImage) {
    return;
  }

  stopWorker();
  previewContext.drawImage(selectedImage, 0, 0);
  solveButton.disabled = true;
  solveButton.textContent = 'Solving…';
  showStatus('Reading the board and finding a home for every cat…');

  try {
    const { pixels, scale } = createDetectionImage(selectedImage);
    solverWorker = new Worker(new URL('./solver-worker.js', import.meta.url), {
      type: 'module',
    });
    solverWorker.onerror = () => {
      handleSolveError('Something went wrong while solving. Please try again.');
    };
    solverWorker.onmessage = ({ data: result }) => {
      handleSolveResult(result, scale);
    };

    // Transfer ownership of the pixel buffer rather than copying it.
    solverWorker.postMessage(pixels, [pixels.data.buffer]);
  } catch {
    handleSolveError('Could not start the solver. Please reload and try again.');
  }
}

function handleSolveResult(result, detectionScale) {
  if (result.error) {
    handleSolveError(result.error);
    return;
  }

  const { board, solution } = result;
  drawSolution(previewContext, board, solution, detectionScale);

  showStatus(`Solved ${board.size} × ${board.size} · Place a cat in each circle.`);
  const humanReadableColumns = solution.map((column) => column + 1).join(', ');
  previewCanvas.setAttribute(
    'aria-label',
    `Solved board. Cat columns by row: ${humanReadableColumns}.`,
  );
  solveButton.disabled = false;
  solveButton.textContent = 'Solve again';
  stopWorker();
}

function handleSolveError(message) {
  showStatus(message, true);
  solveButton.disabled = false;
  solveButton.textContent = 'Solve';
  stopWorker();
}

function resetPreview() {
  stopWorker();
  selectedImage = null;
  solveButton.disabled = true;
  solveButton.textContent = 'Solve';
  previewCanvas.hidden = true;
  emptyState.hidden = false;
  showStatus('Start with a screenshot of an untouched board.');
}

function stopWorker() {
  solverWorker?.terminate();
  solverWorker = null;
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}
