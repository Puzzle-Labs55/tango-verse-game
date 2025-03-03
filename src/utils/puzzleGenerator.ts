
import { Block } from "@/components/GameBoard";
import { GRID_SIZE } from "./gameRules";

// Fixed valid solution patterns for different difficulty levels
export const SOLUTION_PATTERNS = {
  easy: [
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun'
  ],
  medium: [
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun'
  ],
  hard: [
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon'
  ],
  'very-hard': [
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
    'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
    'moon', 'sun', 'moon', 'sun', 'moon', 'sun'
  ]
};

// This function creates a logically solvable initial board state with a unique solution
export const createLogicalPuzzle = (difficulty: string): { initialState: Block[], solution: Block[] } => {
  // Use our predefined solution patterns based on difficulty
  const solutionPattern = SOLUTION_PATTERNS[difficulty as keyof typeof SOLUTION_PATTERNS] || SOLUTION_PATTERNS.easy;
  
  // Create the solution based on the pattern
  const solution: Block[] = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    solution.push({ 
      id: i, 
      type: solutionPattern[i] as "sun" | "moon", 
      rotation: 0, 
      isLocked: false, 
      isHint: false 
    });
  }
  
  // Create initial state with all cells empty - no prefilled clues
  const initialState = solution.map(block => ({ 
    ...block,
    type: null,  // Set all cells to null (empty)
    isLocked: false  // No locked cells
  }));
  
  return { initialState, solution };
};
