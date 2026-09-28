import { detectBoard } from './detection/board.js';
import { solve } from './solver.js';

// Only pixels enter the worker; only board metadata and a solution leave it.
self.onmessage = ({ data: imageData }) => {
  try {
    const board = detectBoard(imageData);
    const solution = solve(board.colors, board.fixedCats);

    if (!solution) {
      throw new Error(
        'No valid solution found with the detected colors and cats. Try a clearer screenshot.',
      );
    }

    self.postMessage({ board, solution });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
