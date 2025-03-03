
import { Block } from "@/types/gameTypes";

export const isValidBoard = (board: Block[], gridSize: number): boolean => {
  for (let row = 0; row < gridSize; row++) {
    let sunCount = 0;
    let moonCount = 0;
    let consecutiveSuns = 0;
    let consecutiveMoons = 0;
    
    for (let col = 0; col < gridSize; col++) {
      const block = board[row * gridSize + col];
      
      if (block.type === 'sun') {
        sunCount++;
        consecutiveSuns++;
        consecutiveMoons = 0;
      } else if (block.type === 'moon') {
        moonCount++;
        consecutiveMoons++;
        consecutiveSuns = 0;
      }
      
      if (consecutiveSuns >= 3 || consecutiveMoons >= 3) return false;
    }
    
    if (sunCount !== moonCount) return false;
  }

  for (let col = 0; col < gridSize; col++) {
    let sunCount = 0;
    let moonCount = 0;
    let consecutiveSuns = 0;
    let consecutiveMoons = 0;
    
    for (let row = 0; row < gridSize; row++) {
      const block = board[row * gridSize + col];
      
      if (block.type === 'sun') {
        sunCount++;
        consecutiveSuns++;
        consecutiveMoons = 0;
      } else if (block.type === 'moon') {
        moonCount++;
        consecutiveMoons++;
        consecutiveSuns = 0;
      }
      
      if (consecutiveSuns >= 3 || consecutiveMoons >= 3) return false;
    }
    
    if (sunCount !== moonCount) return false;
  }

  return true;
};

export const hasUniqueSolution = (board: Block[], gridSize: number): boolean => {
  let emptyCells = 0;
  let constrainedCells = 0;

  for (let i = 0; i < gridSize; i++) {
    const rowSuns = board.slice(i * gridSize, (i + 1) * gridSize).filter(b => b.type === 'sun').length;
    const rowMoons = board.slice(i * gridSize, (i + 1) * gridSize).filter(b => b.type === 'moon').length;
    
    if (rowSuns > gridSize / 2 || rowMoons > gridSize / 2) return false;
    if (rowSuns === gridSize / 2) constrainedCells += gridSize - rowSuns - rowMoons;
    if (rowMoons === gridSize / 2) constrainedCells += gridSize - rowSuns - rowMoons;

    const colSuns = board.filter((b, index) => index % gridSize === i && b.type === 'sun').length;
    const colMoons = board.filter((b, index) => index % gridSize === i && b.type === 'moon').length;
    
    if (colSuns > gridSize / 2 || colMoons > gridSize / 2) return false;
    if (colSuns === gridSize / 2) constrainedCells += gridSize - colSuns - colMoons;
    if (colMoons === gridSize / 2) constrainedCells += gridSize - colSuns - colMoons;
  }

  emptyCells = board.filter(b => b.type === null).length;

  return constrainedCells >= emptyCells;
};

export const checkValidMove = (blocks: Block[], changedIndex: number, gridSize: number): boolean => {
  const row = Math.floor(changedIndex / gridSize);
  const col = changedIndex % gridSize;
  
  // Get row and column cells
  const rowCells = blocks.slice(row * gridSize, (row + 1) * gridSize);
  const colCells = Array.from({ length: gridSize }, (_, i) => blocks[i * gridSize + col]);
  
  // Count suns and moons in row and column
  const rowSuns = rowCells.filter(b => b.type === 'sun').length;
  const rowMoons = rowCells.filter(b => b.type === 'moon').length;
  const colSuns = colCells.filter(b => b.type === 'sun').length;
  const colMoons = colCells.filter(b => b.type === 'moon').length;
  
  // Check for three consecutive same types
  let hasConsecutive = false;
  const checkConsecutive = (cells: Block[]) => {
    let consecutiveSuns = 0;
    let consecutiveMoons = 0;
    
    for (const cell of cells) {
      if (cell.type === 'sun') {
        consecutiveSuns++;
        consecutiveMoons = 0;
      } else if (cell.type === 'moon') {
        consecutiveMoons++;
        consecutiveSuns = 0;
      } else {
        consecutiveSuns = 0;
        consecutiveMoons = 0;
      }
      
      if (consecutiveSuns >= 3 || consecutiveMoons >= 3) {
        return true;
      }
    }
    return false;
  };
  
  hasConsecutive = checkConsecutive(rowCells) || checkConsecutive(colCells);
  
  // Return true if any rule is violated
  return (rowSuns > gridSize / 2 || rowMoons > gridSize / 2 ||
          colSuns > gridSize / 2 || colMoons > gridSize / 2 ||
          hasConsecutive);
};

export const hasLogicalHint = (board: Block[], gridSize: number): boolean => {
  const emptyCells = board
    .map((block, index) => ({ ...block, index }))
    .filter(block => !block.isLocked && block.type === null);

  for (const cell of emptyCells) {
    const row = Math.floor(cell.index / gridSize);
    const col = cell.index % gridSize;
    
    // Check rows
    const rowCells = board.slice(row * gridSize, (row + 1) * gridSize);
    const rowSuns = rowCells.filter(b => b.type === 'sun').length;
    const rowMoons = rowCells.filter(b => b.type === 'moon').length;
    
    // Check columns
    const colCells = Array.from({ length: gridSize }, (_, i) => board[i * gridSize + col]);
    const colSuns = colCells.filter(b => b.type === 'sun').length;
    const colMoons = colCells.filter(b => b.type === 'moon').length;

    // Check consecutive patterns
    const hasConsecutive = (cells: Block[], index: number) => {
      if (index > 0 && index < cells.length - 1) {
        if (cells[index - 1].type === cells[index + 1].type) {
          return true;
        }
      }
      return false;
    };

    // If any constraint is found, there's a logical hint
    if (rowSuns === gridSize / 2 || rowMoons === gridSize / 2 ||
        colSuns === gridSize / 2 || colMoons === gridSize / 2 ||
        hasConsecutive(rowCells, col) || hasConsecutive(colCells, row)) {
      return true;
    }
  }

  return false;
};
