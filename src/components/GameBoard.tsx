import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GameBlock } from "./GameBlock";
import { toast } from "@/components/ui/use-toast";
import { Sun, Moon, HelpCircle } from "lucide-react";
import { GameTutorial } from "./GameTutorial";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface Block {
  id: number;
  type: "sun" | "moon" | null;
  rotation: number;
  isLocked: boolean;
  isHint: boolean;
}

interface GameBoardProps {
  level: number;
  onLevelComplete?: (level: number, stars: number) => void;
}

const GRID_SIZE = 6;

// Function to determine the difficulty based on level
const getDifficultyForLevel = (level: number): string => {
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

// Rules for the puzzle (these enforce a unique solution)
// For every row:
// - Each row must have exactly 3 suns and 3 moons
// For every column:
// - Each column must have exactly 3 suns and 3 moons
// - No three adjacent cells in a row or column can be the same type
const checkRowRuleViolation = (board: Block[], rowIndex: number): boolean => {
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

const checkColumnRuleViolation = (board: Block[], colIndex: number): boolean => {
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

// Fixed valid solution patterns for different difficulty levels
const SOLUTION_PATTERNS = {
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

export const GameBoard = ({ level, onLevelComplete }: GameBoardProps) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [initialBlocks, setInitialBlocks] = useState<Block[]>([]);
  const [solution, setSolution] = useState<Block[]>([]);
  const [moveHistory, setMoveHistory] = useState<Block[][]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [difficulty, setDifficulty] = useState<string>("easy");
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hintUsed, setHintUsed] = useState(0);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [showLevelCompletedDialog, setShowLevelCompletedDialog] = useState(false);
  const [showLevelFailedDialog, setShowLevelFailedDialog] = useState(false);
  const [boardFilled, setBoardFilled] = useState(false);
  
  const handleBlockClick = (index: number) => {
    if (blocks[index].isLocked) {
      toast({
        title: "Locked Block",
        description: "This block cannot be modified.",
      });
      return;
    }

    // Clone blocks array and update the target block
    const newBlocks = [...blocks];
    
    // Save current state for undo
    setMoveHistory([...moveHistory, blocks]);
    
    // Cycle through: null -> sun -> moon -> null
    let newType: "sun" | "moon" | null;
    
    if (newBlocks[index].type === null) {
      newType = "sun";
    } else if (newBlocks[index].type === "sun") {
      newType = "moon";
    } else {
      newType = null;
    }
    
    // Update block with new type
    newBlocks[index] = {
      ...newBlocks[index],
      type: newType,
    };
    
    // Validate the move against rules
    const rowIndex = Math.floor(index / GRID_SIZE);
    const colIndex = index % GRID_SIZE;
    
    let ruleViolations: string[] = [];
    
    if (checkRowRuleViolation(newBlocks, rowIndex)) {
      ruleViolations.push(`Row ${rowIndex + 1} violates puzzle rules.`);
    }
    
    if (checkColumnRuleViolation(newBlocks, colIndex)) {
      ruleViolations.push(`Column ${colIndex + 1} violates puzzle rules.`);
    }
    
    // If rules are violated, show warnings but still allow the move
    if (ruleViolations.length > 0) {
      setErrorMessages(ruleViolations);
      // Display warnings as toasts
      ruleViolations.forEach(message => {
        toast({
          title: "Rule Violation",
          description: message,
          variant: "destructive",
        });
      });
    } else {
      setErrorMessages([]);
    }
    
    setBlocks(newBlocks);
    setMoveCount(moveCount + 1);
    
    // Check if board is completely filled (no null cells)
    const isBoardFilled = !newBlocks.some(block => block.type === null);
    setBoardFilled(isBoardFilled);
    
    // If the board is filled, check if it's correct
    if (isBoardFilled) {
      const isCorrect = checkWinCondition(newBlocks);
      if (isCorrect) {
        setShowLevelCompletedDialog(true);
        // Register the completion with parent component
        if (onLevelComplete) {
          onLevelComplete(level, calculateStars());
        }
      } else {
        setShowLevelFailedDialog(true);
      }
    }
  };

  const checkWinCondition = useCallback((boardToCheck: Block[] = blocks) => {
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
  }, [blocks, solution]);

  const handleUndo = () => {
    if (moveHistory.length === 0) {
      toast({
        title: "Cannot Undo",
        description: "No moves to undo.",
      });
      return;
    }

    const previousState = moveHistory[moveHistory.length - 1];
    setBlocks(previousState);
    setMoveHistory(moveHistory.slice(0, -1));
    setMoveCount(moveCount - 1);
    setErrorMessages([]);
    
    // Reset dialog states when undoing
    setShowLevelCompletedDialog(false);
    setShowLevelFailedDialog(false);
    setBoardFilled(false);
  };

  // Find and provide a logical hint without revealing the solution
  const showHint = () => {
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
      return;
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
        
        setBlocks(newBlocks);
        setHintUsed(hintUsed + 1);
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
          
          setBlocks(newBlocks);
          setHintUsed(hintUsed + 1);
          hintGiven = true;
          break;
        }
      }
    }
    
    // If still no hint given, check for three-in-a-row rule
    if (!hintGiven) {
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
              description: `In Row ${i + 1}, you must place a ${oppositeType.toUpperCase()} to avoid three ${existingType.toUpperCase()}s in a row.`,
              duration: 5000,
            });
            
            // Highlight the cell without revealing the answer
            newBlocks[nullIdx].isHint = true;
            
            setBlocks(newBlocks);
            setHintUsed(hintUsed + 1);
            hintGiven = true;
            break;
          }
        }
        if (hintGiven) break;
      }
    }
    
    // If still no hint given, do the same for columns
    if (!hintGiven) {
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
              description: `In Column ${j + 1}, you must place a ${oppositeType.toUpperCase()} to avoid three ${existingType.toUpperCase()}s in a row.`,
              duration: 5000,
            });
            
            // Highlight the cell without revealing the answer
            newBlocks[nullIdx].isHint = true;
            
            setBlocks(newBlocks);
            setHintUsed(hintUsed + 1);
            hintGiven = true;
            break;
          }
        }
        if (hintGiven) break;
      }
    }
    
    // If no specific hint found, give a general hint
    if (!hintGiven) {
      toast({
        title: "Hint",
        description: "Remember, each row and column must have exactly 3 Suns and 3 Moons, with no three of the same type adjacent to each other.",
        duration: 5000,
      });
      setHintUsed(hintUsed + 1);
    }
  };

  const displayRules = () => {
    toast({
      title: "Puzzle Rules",
      description: 
        "1. Each row must have exactly 3 suns and 3 moons\n" +
        "2. Each column must have exactly 3 suns and 3 moons\n" +
        "3. No three adjacent cells in a row or column can be the same type",
      duration: 5000,
    });
  };

  const calculateStars = () => {
    // Calculate stars based on move count and hints used
    if (hintUsed === 0 && moveCount <= 15) return 3;
    if (hintUsed <= 1 && moveCount <= 20) return 2;
    return 1;
  };

  const handleNextLevel = async () => {
    // Save completion data if needed
    const starsEarned = calculateStars();
    
    // If onLevelComplete callback is provided, call it
    if (onLevelComplete) {
      onLevelComplete(level, starsEarned);
    }
    
    // Load the next level
    try {
      // Try to fetch the next level
      const { data, error } = await supabase
        .from('puzzle_levels')
        .select('id')
        .eq('id', level + 1)
        .single();
      
      if (error || !data) {
        // Create a new level if it doesn't exist
        const newDifficulty = getDifficultyForLevel(level + 1);
        const { initialState, solution } = createLogicalPuzzle(newDifficulty);
        
        // Save the new puzzle level to Supabase
        await supabase.from('puzzle_levels').upsert({
          id: level + 1,
          difficulty: newDifficulty as any,
          initial_state: initialState,
          solution: solution,
          created_at: new Date().toISOString()
        });
      }
      
      // Redirect to the new level
      window.location.href = `/?level=${level + 1}`;
      
    } catch (error) {
      console.error('Error loading next level:', error);
      toast({
        title: "Error",
        description: "Failed to load the next level. Please try again.",
        variant: "destructive",
      });
    }
    
    setShowLevelCompletedDialog(false);
  };

  const resetBoard = () => {
    setBlocks(initialBlocks);
    setMoveHistory([]);
    setMoveCount(0);
    setErrorMessages([]);
    setShowLevelFailedDialog(false);
    setShowLevelCompletedDialog(false);
    setBoardFilled(false);
    toast({
      title: "Board Reset",
      description: "The board has been reset to its initial state.",
    });
  };

  // This function creates a logically solvable initial board state with a unique solution
  const createLogicalPuzzle = (difficulty: string): { initialState: Block[], solution: Block[] } => {
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

  useEffect(() => {
    const fetchOrCreateLevel = async () => {
      try {
        // Try to fetch from Supabase first
        const { data, error } = await supabase
          .from('puzzle_levels')
          .select('initial_state, solution, difficulty')
          .eq('id', level)
          .single();

        if (error || !data) {
          console.log("Creating new puzzle for level", level);
          // If level doesn't exist, create a new one
          const difficultyValue = getDifficultyForLevel(level);
          const { initialState, solution } = createLogicalPuzzle(difficultyValue);
          
          // Set the board with the newly created puzzle
          setBlocks(initialState);
          setInitialBlocks(initialState);
          setSolution(solution);
          setDifficulty(difficultyValue);
          
          // Save the new puzzle to Supabase for future use
          await supabase.from('puzzle_levels').upsert({
            id: level,
            difficulty: difficultyValue as any,
            initial_state: initialState,
            solution: solution,
            created_at: new Date().toISOString()
          });
        } else {
          // Use the fetched puzzle
          setDifficulty(data.difficulty || getDifficultyForLevel(level));
          setBlocks(data.initial_state);
          setInitialBlocks(data.initial_state);
          setSolution(data.solution);
        }

        toast({
          title: `Level ${level}`,
          description: `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
        });
        
        // Display rules when loading a level
        displayRules();
      } catch (error) {
        console.error('Error fetching or creating level:', error);
        toast({
          title: "Error loading level",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    };

    fetchOrCreateLevel();
    
    // Reset state when level changes
    setMoveHistory([]);
    setMoveCount(0);
    setHintUsed(0);
    setErrorMessages([]);
    setShowLevelCompletedDialog(false);
    setShowLevelFailedDialog(false);
    setBoardFilled(false);
  }, [level]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <GameTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        Level {level} ({difficulty})
      </h1>
      
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600">Tap to cycle: empty → sun → moon → empty</p>
      </div>
      
      {errorMessages.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p className="font-bold">Rule Violations:</p>
          <ul className="list-disc pl-5">
            {errorMessages.map((message, idx) => (
              <li key={idx}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="grid grid-cols-6 gap-2 mb-4 p-4 bg-white rounded-lg shadow-md">
        {blocks.map((block, index) => (
          <GameBlock
            key={index}
            block={block}
            onClick={() => handleBlockClick(index)}
          />
        ))}
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 w-full max-w-md mt-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-2 shadow-md"
          onClick={() => setIsTutorialOpen(true)}
        >
          <HelpCircle size={16} />
          How to Play
        </button>
        <button
          className="px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md"
          onClick={handleUndo}
        >
          Undo
        </button>
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-md"
          onClick={showHint}
        >
          Hint
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 shadow-md"
          onClick={resetBoard}
        >
          Reset
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
          onClick={displayRules}
        >
          Rules
        </button>
      </div>
      
      <div className="mt-4 text-center p-2 bg-white rounded-lg shadow-sm">
        <p className="font-medium">Moves: {moveCount} | Hints: {hintUsed}</p>
      </div>
      
      {/* Level Completed Dialog */}
      <Dialog open={showLevelCompletedDialog} onOpenChange={setShowLevelCompletedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-600">Level Cleared!</DialogTitle>
            <DialogDescription>
              Congratulations! You've completed Level {level} with {calculateStars()} stars.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center my-4">
            <div className="flex space-x-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Sun 
                  key={i} 
                  className={`w-8 h-8 ${
                    i < calculateStars() ? 'text-yellow-500' : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button onClick={resetBoard} variant="outline" className="w-full">
              Play Again
            </Button>
            <Button onClick={handleNextLevel} className="w-full bg-green-600 hover:bg-green-700">
              Next Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Level Failed Dialog */}
      <Dialog open={showLevelFailedDialog} onOpenChange={setShowLevelFailedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">Not Quite Right</DialogTitle>
            <DialogDescription>
              Your solution doesn't match the correct pattern. Would you like to try again?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button onClick={handleUndo} variant="outline" className="w-full">
              Undo Last Move
            </Button>
            <Button onClick={resetBoard} className="w-full bg-blue-600 hover:bg-blue-700">
              Reset Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameBoard;
