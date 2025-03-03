
import { Block } from "@/components/GameBoard";
import { GRID_SIZE } from "./gameRules";
import { toast } from "@/components/ui/use-toast";

export const generateHint = (blocks: Block[]): {newBlocks: Block[], hintGiven: boolean} => {
  // Find all empty cells
  const emptyCells = blocks.reduce((acc: number[], block, index) => {
    if (!block.isLocked && block.type === null) {
      acc.push(index);
    }
    return acc;
  }, []);

  if (emptyCells.length === 0) {
    toast({
      title: "No Empty Cells",
      description: "There are no empty cells to provide hints for.",
    });
    return {newBlocks: blocks, hintGiven: false};
  }

  // Clear previous hints
  const newBlocks = [...blocks].map(block => ({
    ...block,
    isHint: false
  }));

  // Find a cell where we can provide logical reasoning
  let hintGiven = false;
  
  // Try to find a row that has 5 filled cells (one missing)
  for (let i = 0; i < GRID_SIZE; i++) {
    const rowCells = Array(GRID_SIZE).fill(0).map((_, j) => i * GRID_SIZE + j);
    const emptiesInRow = rowCells.filter(idx => newBlocks[idx].type === null);
    
    if (emptiesInRow.length === 1) {
      const emptyIdx = emptiesInRow[0];
      const suns = rowCells.filter(idx => newBlocks[idx].type === "sun").length;
      const moons = rowCells.filter(idx => newBlocks[idx].type === "moon").length;
      
      toast({
        title: "Logical Hint",
        description: `In Row ${i + 1}, there are already ${suns} Suns and ${moons} Moons. Each row must have exactly 3 of each.`,
        duration: 5000,
      });
      
      // Highlight the cell without revealing the answer
      newBlocks[emptyIdx].isHint = true;
      
      hintGiven = true;
      break;
    }
  }
  
  // If no row hint was given, try columns
  if (!hintGiven) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const colCells = Array(GRID_SIZE).fill(0).map((_, i) => i * GRID_SIZE + j);
      const emptiesInCol = colCells.filter(idx => newBlocks[idx].type === null);
      
      if (emptiesInCol.length === 1) {
        const emptyIdx = emptiesInCol[0];
        const suns = colCells.filter(idx => newBlocks[idx].type === "sun").length;
        const moons = colCells.filter(idx => newBlocks[idx].type === "moon").length;
        
        toast({
          title: "Logical Hint",
          description: `In Column ${j + 1}, there are already ${suns} Suns and ${moons} Moons. Each column must have exactly 3 of each.`,
          duration: 5000,
        });
        
        // Highlight the cell without revealing the answer
        newBlocks[emptyIdx].isHint = true;
        
        hintGiven = true;
        break;
      }
    }
  }
  
  // If still no hint given, check for three-in-a-row rule
  if (!hintGiven) {
    hintGiven = checkThreeInARowHint(newBlocks);
  }
  
  // If no specific hint found, give a general hint
  if (!hintGiven) {
    toast({
      title: "Hint",
      description: "Remember, each row and column must have exactly 3 Suns and 3 Moons, with no three of the same type adjacent to each other.",
      duration: 5000,
    });
  }

  return {newBlocks, hintGiven};
};

const checkThreeInARowHint = (newBlocks: Block[]): boolean => {
  // Check for potential three-in-a-row violations in rows
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE - 2; j++) {
      const indices = [i * GRID_SIZE + j, i * GRID_SIZE + j + 1, i * GRID_SIZE + j + 2];
      const types = indices.map(idx => newBlocks[idx].type);
      
      // If we have two of the same type with a null in between
      if (
        (types[0] === types[2] && types[0] !== null && types[1] === null) ||
        (types[0] === types[1] && types[0] !== null && types[2] === null) ||
        (types[1] === types[2] && types[1] !== null && types[0] === null)
      ) {
        const nullIdx = indices[types.indexOf(null)];
        const existingType = types[0] !== null ? types[0] : types[1];
        const oppositeType = existingType === "sun" ? "moon" : "sun";
        
        toast({
          title: "Logical Hint",
          description: `In Row ${Math.floor(nullIdx / GRID_SIZE) + 1}, you must place a ${oppositeType.toUpperCase()} to avoid three ${existingType.toUpperCase()}s in a row.`,
          duration: 5000,
        });
        
        // Highlight the cell without revealing the answer
        newBlocks[nullIdx].isHint = true;
        
        return true;
      }
    }
  }
  
  // Check for potential three-in-a-row violations in columns
  for (let j = 0; j < GRID_SIZE; j++) {
    for (let i = 0; i < GRID_SIZE - 2; i++) {
      const indices = [i * GRID_SIZE + j, (i + 1) * GRID_SIZE + j, (i + 2) * GRID_SIZE + j];
      const types = indices.map(idx => newBlocks[idx].type);
      
      // If we have two of the same type with a null in between
      if (
        (types[0] === types[2] && types[0] !== null && types[1] === null) ||
        (types[0] === types[1] && types[0] !== null && types[2] === null) ||
        (types[1] === types[2] && types[1] !== null && types[0] === null)
      ) {
        const nullIdx = indices[types.indexOf(null)];
        const existingType = types[0] !== null ? types[0] : types[1];
        const oppositeType = existingType === "sun" ? "moon" : "sun";
        
        toast({
          title: "Logical Hint",
          description: `In Column ${nullIdx % GRID_SIZE + 1}, you must place a ${oppositeType.toUpperCase()} to avoid three ${existingType.toUpperCase()}s in a row.`,
          duration: 5000,
        });
        
        // Highlight the cell without revealing the answer
        newBlocks[nullIdx].isHint = true;
        
        return true;
      }
    }
  }
  
  return false;
};

export const calculateStars = (moveCount: number, hintUsed: number): number => {
  // Calculate stars based on move count and hints used
  if (hintUsed === 0 && moveCount <= 15) return 3;
  if (hintUsed <= 1 && moveCount <= 20) return 2;
  return 1;
};

export const displayRules = () => {
  toast({
    title: "Puzzle Rules",
    description: 
      "1. Each row must have exactly 3 suns and 3 moons\n" +
      "2. Each column must have exactly 3 suns and 3 moons\n" +
      "3. No three adjacent cells in a row or column can be the same type",
    duration: 5000,
  });
};
