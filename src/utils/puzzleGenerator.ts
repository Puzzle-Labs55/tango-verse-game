import { Block, Difficulty } from "@/types/gameTypes";
import { isValidBoard, hasUniqueSolution, hasLogicalHint } from "./gameRules";

export const generateValidBoard = (): Block[] => {
  let isValid = false;
  let board: Block[] = [];
  let attempts = 0;
  const maxAttempts = 1000;
  const gridSize = 6;

  while (!isValid && attempts < maxAttempts) {
    attempts++;
    board = Array.from({ length: gridSize * gridSize }, (_, index) => ({
      id: index,
      type: null,
      rotation: 0,
      isLocked: false,
      isHint: false
    }));

    if (fillBoardBacktrack(board, 0, gridSize)) {
      isValid = true;
    }
  }

  if (!isValid) {
    console.log("Failed to generate valid board, using backup method");
    board = generateSimpleValidBoard(gridSize);
  }

  return board;
};

const fillBoardBacktrack = (board: Block[], position: number, gridSize: number): boolean => {
  if (position === gridSize * gridSize) {
    return isValidBoard(board, gridSize);
  }

  const row = Math.floor(position / gridSize);
  const col = position % gridSize;

  const types: ('sun' | 'moon')[] = ['sun', 'moon'];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  for (const type of types) {
    board[position] = {
      ...board[position],
      type
    };

    if (isPartialBoardValid(board, row, col, gridSize)) {
      if (fillBoardBacktrack(board, position + 1, gridSize)) {
        return true;
      }
    }
  }

  board[position] = {
    ...board[position],
    type: null
  };
  return false;
};

const isPartialBoardValid = (board: Block[], row: number, col: number, gridSize: number): boolean => {
  const rowBlocks = board.slice(row * gridSize, (row + 1) * gridSize)
    .filter(b => b.type !== null);
  const rowSuns = rowBlocks.filter(b => b.type === 'sun').length;
  const rowMoons = rowBlocks.filter(b => b.type === 'moon').length;
  
  if (rowSuns > gridSize / 2 || rowMoons > gridSize / 2) return false;
  
  let consecutiveSuns = 0;
  let consecutiveMoons = 0;
  for (let c = 0; c <= col; c++) {
    const block = board[row * gridSize + c];
    if (block.type === 'sun') {
      consecutiveSuns++;
      consecutiveMoons = 0;
    } else if (block.type === 'moon') {
      consecutiveMoons++;
      consecutiveSuns = 0;
    }
    if (consecutiveSuns > 2 || consecutiveMoons > 2) return false;
  }

  const colBlocks = Array.from({ length: gridSize }, (_, i) => board[i * gridSize + col])
    .filter(b => b.type !== null);
  const colSuns = colBlocks.filter(b => b.type === 'sun').length;
  const colMoons = colBlocks.filter(b => b.type === 'moon').length;
  
  if (colSuns > gridSize / 2 || colMoons > gridSize / 2) return false;
  
  consecutiveSuns = 0;
  consecutiveMoons = 0;
  for (let r = 0; r <= row; r++) {
    const block = board[r * gridSize + col];
    if (block.type === 'sun') {
      consecutiveSuns++;
      consecutiveMoons = 0;
    } else if (block.type === 'moon') {
      consecutiveMoons++;
      consecutiveSuns = 0;
    }
    if (consecutiveSuns > 2 || consecutiveMoons > 2) return false;
  }

  return true;
};

const generateSimpleValidBoard = (gridSize: number): Block[] => {
  const board: Block[] = Array.from({ length: gridSize * gridSize }, (_, index) => ({
    id: index,
    type: Math.random() < 0.5 ? 'sun' : 'moon',
    rotation: 0,
    isLocked: false,
    isHint: false
  }));

  for (let i = 0; i < board.length; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    
    if (col >= 2) {
      const prev2 = board[i - 2].type;
      const prev1 = board[i - 1].type;
      if (prev2 === prev1 && prev1 === board[i].type) {
        board[i].type = board[i].type === 'sun' ? 'moon' : 'sun';
      }
    }
    
    if (row >= 2) {
      const prev2 = board[i - 2 * gridSize].type;
      const prev1 = board[i - gridSize].type;
      if (prev2 === prev1 && prev1 === board[i].type) {
        board[i].type = board[i].type === 'sun' ? 'moon' : 'sun';
      }
    }
  }

  return board;
};

export const createPuzzle = (
  solution: Block[], 
  difficulty: Difficulty, 
  difficultySettings: Record<Difficulty, { cellsToRemove: number, maxConsecutive: number }>,
  gridSize: number
): Block[] => {
  let puzzle = [...solution];
  const settings = difficultySettings[difficulty];
  const cellsToRemove = Math.floor(gridSize * gridSize * settings.cellsToRemove);
  const removedCells = new Set<number>();

  // Keep track of critical cells that force patterns
  const criticalHints = new Set<number>();

  // Ensure each row and column has at least one fixed cell
  for (let i = 0; i < gridSize; i++) {
    const rowStart = i * gridSize;
    const rowHint = rowStart + Math.floor(Math.random() * gridSize);
    criticalHints.add(rowHint);
  
    const colHint = i + (Math.floor(Math.random() * gridSize) * gridSize);
    criticalHints.add(colHint);
  }

  const attemptRemoveCell = (index: number): boolean => {
    if (criticalHints.has(index)) return false;
  
    const testPuzzle = puzzle.map((block, i) => ({
      ...block,
      type: i === index ? null : block.type,
      isLocked: i !== index && !removedCells.has(i)
    }));
  
    // Check if removing this cell maintains a unique solution
    // AND ensures there's at least one logical hint available
    return hasUniqueSolution(testPuzzle, gridSize) && hasLogicalHint(testPuzzle, gridSize);
  };

  while (removedCells.size < cellsToRemove) {
    const availableCells = Array.from({ length: gridSize * gridSize }, (_, i) => i)
      .filter(i => !removedCells.has(i) && !criticalHints.has(i));
    
    if (availableCells.length === 0) break;
    
    // Try cells in random order
    const randomIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
  
    if (attemptRemoveCell(randomIndex)) {
      removedCells.add(randomIndex);
      puzzle[randomIndex] = { ...puzzle[randomIndex], type: null };
    }
  }

  return puzzle.map((block, index) => ({
    ...block,
    type: removedCells.has(index) ? null : block.type,
    isLocked: !removedCells.has(index),
    isHint: false,
    // Add random rotation for visual interest
    rotation: Math.floor(Math.random() * 4) * 90
  }));
};
