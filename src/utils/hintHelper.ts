
import { Block } from "@/types/gameTypes";

export const getLogicalExplanation = (newBlocks: Block[], hintCell: number, gridSize: number): string => {
  const row = Math.floor(hintCell / gridSize);
  const col = hintCell % gridSize;
  
  const rowCells = newBlocks.slice(row * gridSize, (row + 1) * gridSize);
  const colCells = Array.from({ length: gridSize }, (_, i) => newBlocks[i * gridSize + col]);
  
  const rowSuns = rowCells.filter(b => b.type === 'sun').length;
  const rowMoons = rowCells.filter(b => b.type === 'moon').length;
  const colSuns = colCells.filter(b => b.type === 'sun').length;
  const colMoons = colCells.filter(b => b.type === 'moon').length;

  // Check for consecutive patterns
  const checkConsecutivePattern = (cells: Block[], index: number) => {
    if (index > 0 && index < cells.length - 1) {
      if (cells[index - 1].type === cells[index + 1].type) {
        return `To avoid three ${cells[index - 1].type}s in a row`;
      }
    }
    return null;
  };

  // Get row and column based explanations
  const rowPattern = checkConsecutivePattern(rowCells, col);
  const colPattern = checkConsecutivePattern(colCells, row);

  if (rowSuns === gridSize / 2) {
    return "This cell must be a moon because this row already has the maximum number of suns";
  }
  if (rowMoons === gridSize / 2) {
    return "This cell must be a sun because this row already has the maximum number of moons";
  }
  if (colSuns === gridSize / 2) {
    return "This cell must be a moon because this column already has the maximum number of suns";
  }
  if (colMoons === gridSize / 2) {
    return "This cell must be a sun because this column already has the maximum number of moons";
  }
  if (rowPattern) {
    return rowPattern;
  }
  if (colPattern) {
    return colPattern;
  }

  return "This cell's value can be deduced from the surrounding pattern";
};

export const findHintCell = (blocks: Block[], gridSize: number): number => {
  const emptyCells = blocks
    .map((block, index) => ({ ...block, index }))
    .filter(block => !block.isLocked && block.type === null);

  if (emptyCells.length === 0) {
    return -1;
  }

  for (const cell of emptyCells) {
    const row = Math.floor(cell.index / gridSize);
    const col = cell.index % gridSize;
    
    // Check rows
    const rowCells = blocks.slice(row * gridSize, (row + 1) * gridSize);
    const rowSuns = rowCells.filter(b => b.type === 'sun').length;
    const rowMoons = rowCells.filter(b => b.type === 'moon').length;
    
    // Check columns
    const colCells = Array.from({ length: gridSize }, (_, i) => blocks[i * gridSize + col]);
    const colSuns = colCells.filter(b => b.type === 'sun').length;
    const colMoons = colCells.filter(b => b.type === 'moon').length;

    // Check consecutive patterns
    const hasConsecutive = (cells: Block[], index: number) => {
      if (index > 0 && index < cells.length - 1) {
        if (cells[index - 1].type === cells[index + 1].type && cells[index - 1].type !== null) {
          return true;
        }
      }
      return false;
    };

    // If any constraint is found, there's a logical hint
    if (rowSuns === gridSize / 2 || rowMoons === gridSize / 2 ||
        colSuns === gridSize / 2 || colMoons === gridSize / 2 ||
        hasConsecutive(rowCells, col) || hasConsecutive(colCells, row)) {
      return cell.index;
    }
  }

  return -1;
};
