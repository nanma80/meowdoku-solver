import { detectBoard } from './detection/board.js';
import { solve } from './solver.js';

// Only pixels enter the worker; only board metadata and a solution leave it.
self.onmessage = ({ data: imageData }) => {
  try {
    const board = detectBoard(imageData);
    const solution = solve(board.colors);

    if (!solution) {
      throw new Error(
        'No valid solution found. Please try another untouched screenshot.',
      );
    }

    self.postMessage({ board, solution });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
