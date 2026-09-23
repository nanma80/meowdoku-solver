import {detectBoard} from './detector.js';
import {solve} from './solver.js';
self.onmessage=({data})=>{
  try {
    const board=detectBoard(data), solution=solve(board.colors);
    if(!solution) throw new Error('No valid solution found. Please try another untouched screenshot.');
    self.postMessage({board,solution});
  } catch(error) {self.postMessage({error:error.message});}
};
