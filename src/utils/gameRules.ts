
import { Block } from "@/components/GameBoard";

export const GRID_SIZE = 6;

// Function to determine the difficulty based on level
export const getDifficultyForLevel = (level: number): string => {
  const cyclePosition = (level - 1) % 5;
  switch (cyclePosition) {
    case 0:
    case 1:
      return "easy";
    case 2:
      return "medium";
    case 3:
      return "hard";
    case 4:
      return "very-hard";
    default:
      return "easy";
  }
};

// Check if a row violates the puzzle rules
export const checkRowRuleViolation = (board: Block[], rowIndex: number): boolean => {
  // Get all blocks in this row
  const rowBlocks = Array(GRID_SIZE)
    .fill(0)
    .map((_, i) => board[rowIndex * GRID_SIZE + i]);
  
  // Count suns and moons (only count non-null types)
  const suns = rowBlocks.filter(block => block.type === "sun").length;
  const moons = rowBlocks.filter(block => block.type === "moon").length;
  
  const nullCells = rowBlocks.filter(block => block.type === null).length;
  
  // If there are already more than 3 suns or moons, rule violated
  if (suns > 3 || moons > 3) return true;
  
  // If there's no way to meet the requirement with remaining cells, rule violated
  if (suns + nullCells < 3 || moons + nullCells < 3) return true;
  
  // Check for 3 adjacent same types
  for (let i = 0; i < GRID_SIZE - 2; i++) {
    if (
      rowBlocks[i].type !== null &&
      rowBlocks[i].type === rowBlocks[i + 1].type &&
      rowBlocks[i].type === rowBlocks[i + 2].type
    ) {
      return true;
    }
  }
  
  return false;
};

export const checkColumnRuleViolation = (board: Block[], colIndex: number): boolean => {
  // Get all blocks in this column
  const columnBlocks = Array(GRID_SIZE)
    .fill(0)
    .map((_, i) => board[i * GRID_SIZE + colIndex]);
  
  // Count suns and moons (only count non-null types)
  const suns = columnBlocks.filter(block => block.type === "sun").length;
  const moons = columnBlocks.filter(block => block.type === "moon").length;
  
  const nullCells = columnBlocks.filter(block => block.type === null).length;
  
  // If there are already more than 3 suns or moons, rule violated
  if (suns > 3 || moons > 3) return true;
  
  // If there's no way to meet the requirement with remaining cells, rule violated
  if (suns + nullCells < 3 || moons + nullCells < 3) return true;
  
  // Check for 3 adjacent same types
  for (let i = 0; i < GRID_SIZE - 2; i++) {
    if (
      columnBlocks[i].type !== null &&
      columnBlocks[i].type === columnBlocks[i + 1].type &&
      columnBlocks[i].type === columnBlocks[i + 2].type
    ) {
      return true;
    }
  }
  
  return false;
};

// Check if a board configuration is valid and matches the solution
export const checkWinCondition = (boardToCheck: Block[], solution: Block[]): boolean => {
  if (boardToCheck.length === 0 || solution.length === 0) return false;

  for (let i = 0; i < boardToCheck.length; i++) {
    if (boardToCheck[i].type !== solution[i].type) {
      return false;
    }
  }
  
  // Additional check: all rules must be satisfied
  for (let i = 0; i < GRID_SIZE; i++) {
    if (checkRowRuleViolation(boardToCheck, i) || checkColumnRuleViolation(boardToCheck, i)) {
      return false;
    }
  }
  
  return true;
};
