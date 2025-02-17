
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GameBlock } from "./GameBlock";
import { toast } from "@/components/ui/use-toast";
import { Sun, Moon } from "lucide-react";

export interface Block {
  id: number;
  type: 'sun' | 'moon' | null;
  rotation: number;
  isLocked: boolean;
  isHint: boolean;
}

interface Move {
  blockId: number;
  previousType: 'sun' | 'moon' | null;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const GRID_SIZE = 6;
const HINT_COOLDOWN = 20; // seconds

const DIFFICULTY_SETTINGS = {
  easy: { cellsToRemove: 0.4, maxConsecutive: 2 },
  medium: { cellsToRemove: 0.5, maxConsecutive: 3 },
  hard: { cellsToRemove: 0.6, maxConsecutive: 3 }
};

export const GameBoard = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [solution, setSolution] = useState<Block[]>([]);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  
  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && !isPuzzleSolved) {
      interval = setInterval(() => {
        setTimer((time) => time + 1);
      }, 1000);
    } else if (!isActive && !isPuzzleSolved) {
      if (interval) clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPuzzleSolved]);

  // Hint cooldown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (hintCooldown > 0) {
      interval = setInterval(() => {
        setHintCooldown((time) => Math.max(0, time - 1));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hintCooldown]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateValidBoard = (): Block[] => {
    let isValid = false;
    let board: Block[] = [];
    let attempts = 0;
    const maxAttempts = 1000;

    while (!isValid && attempts < maxAttempts) {
      attempts++;
      // Start with an empty board
      board = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
        id: index,
        type: null,
        rotation: 0,
        isLocked: false,
        isHint: false
      }));

      // Fill board using backtracking
      if (fillBoardBacktrack(board, 0)) {
        isValid = true;
      }
    }

    if (!isValid) {
      console.log("Failed to generate valid board, using backup method");
      // Use simpler generation method as backup
      board = generateSimpleValidBoard();
    }

    return board;
  };

  const fillBoardBacktrack = (board: Block[], position: number): boolean => {
    if (position === GRID_SIZE * GRID_SIZE) {
      return isValidBoard(board);
    }

    const row = Math.floor(position / GRID_SIZE);
    const col = position % GRID_SIZE;

    // Try both sun and moon
    const types: ('sun' | 'moon')[] = ['sun', 'moon'];
    // Shuffle array to randomize
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    for (const type of types) {
      board[position] = {
        ...board[position],
        type
      };

      // Check if current partial board is valid
      if (isPartialBoardValid(board, row, col)) {
        if (fillBoardBacktrack(board, position + 1)) {
          return true;
        }
      }
    }

    // If no solution found, backtrack
    board[position] = {
      ...board[position],
      type: null
    };
    return false;
  };

  const isPartialBoardValid = (board: Block[], row: number, col: number): boolean => {
    // Check current row
    const rowBlocks = board.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE)
      .filter(b => b.type !== null);
    const rowSuns = rowBlocks.filter(b => b.type === 'sun').length;
    const rowMoons = rowBlocks.filter(b => b.type === 'moon').length;
    
    if (rowSuns > GRID_SIZE / 2 || rowMoons > GRID_SIZE / 2) return false;
    
    // Check consecutive in row
    let consecutiveSuns = 0;
    let consecutiveMoons = 0;
    for (let c = 0; c <= col; c++) {
      const block = board[row * GRID_SIZE + c];
      if (block.type === 'sun') {
        consecutiveSuns++;
        consecutiveMoons = 0;
      } else if (block.type === 'moon') {
        consecutiveMoons++;
        consecutiveSuns = 0;
      }
      if (consecutiveSuns > 2 || consecutiveMoons > 2) return false;
    }

    // Check current column
    const colBlocks = Array.from({ length: GRID_SIZE }, (_, i) => board[i * GRID_SIZE + col])
      .filter(b => b.type !== null);
    const colSuns = colBlocks.filter(b => b.type === 'sun').length;
    const colMoons = colBlocks.filter(b => b.type === 'moon').length;
    
    if (colSuns > GRID_SIZE / 2 || colMoons > GRID_SIZE / 2) return false;
    
    // Check consecutive in column
    consecutiveSuns = 0;
    consecutiveMoons = 0;
    for (let r = 0; r <= row; r++) {
      const block = board[r * GRID_SIZE + col];
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

  const generateSimpleValidBoard = (): Block[] => {
    const board: Block[] = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
      id: index,
      type: Math.random() < 0.5 ? 'sun' : 'moon',
      rotation: 0,
      isLocked: false,
      isHint: false
    }));

    // Ensure no more than 2 consecutive same types
    for (let i = 0; i < board.length; i++) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;
      
      // Check horizontal
      if (col >= 2) {
        const prev2 = board[i - 2].type;
        const prev1 = board[i - 1].type;
        if (prev2 === prev1 && prev1 === board[i].type) {
          board[i].type = board[i].type === 'sun' ? 'moon' : 'sun';
        }
      }
      
      // Check vertical
      if (row >= 2) {
        const prev2 = board[i - 2 * GRID_SIZE].type;
        const prev1 = board[i - GRID_SIZE].type;
        if (prev2 === prev1 && prev1 === board[i].type) {
          board[i].type = board[i].type === 'sun' ? 'moon' : 'sun';
        }
      }
    }

    return board;
  };

  const hasUniqueSolution = (board: Block[]): boolean => {
    // Count empty cells and their possible values
    let emptyCells = 0;
    let constrainedCells = 0;

    // Check rows and columns for constraints
    for (let i = 0; i < GRID_SIZE; i++) {
      // Check rows
      const rowSuns = board.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE).filter(b => b.type === 'sun').length;
      const rowMoons = board.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE).filter(b => b.type === 'moon').length;
      
      if (rowSuns > GRID_SIZE / 2 || rowMoons > GRID_SIZE / 2) return false;
      if (rowSuns === GRID_SIZE / 2) constrainedCells += GRID_SIZE - rowSuns - rowMoons;
      if (rowMoons === GRID_SIZE / 2) constrainedCells += GRID_SIZE - rowSuns - rowMoons;

      // Check columns
      const colSuns = board.filter((b, index) => index % GRID_SIZE === i && b.type === 'sun').length;
      const colMoons = board.filter((b, index) => index % GRID_SIZE === i && b.type === 'moon').length;
      
      if (colSuns > GRID_SIZE / 2 || colMoons > GRID_SIZE / 2) return false;
      if (colSuns === GRID_SIZE / 2) constrainedCells += GRID_SIZE - colSuns - colMoons;
      if (colMoons === GRID_SIZE / 2) constrainedCells += GRID_SIZE - colSuns - colMoons;
    }

    // Count empty cells
    emptyCells = board.filter(b => b.type === null).length;

    // If all empty cells are constrained, solution is unique
    return constrainedCells >= emptyCells;
  };

  const generatePredefinedBoard = (): Block[] => {
    // A predefined valid board with a unique solution
    return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
      id: index,
      type: [
        'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
        'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
        'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
        'moon', 'sun', 'moon', 'sun', 'moon', 'sun',
        'sun', 'moon', 'sun', 'moon', 'sun', 'moon',
        'moon', 'sun', 'moon', 'sun', 'moon', 'sun'
      ][index] as 'sun' | 'moon',
      rotation: 0,
      isLocked: false,
      isHint: false
    }));
  };

  const createPuzzle = (solution: Block[]): Block[] => {
    let puzzle = [...solution];
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const cellsToRemove = Math.floor(GRID_SIZE * GRID_SIZE * settings.cellsToRemove);
    const removedCells = new Set<number>();
    
    while (removedCells.size < cellsToRemove) {
      const randomIndex = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
      
      // Check if removing this cell would still maintain a unique solution
      const testPuzzle = [...puzzle];
      testPuzzle[randomIndex] = { ...testPuzzle[randomIndex], type: null };
      
      if (!removedCells.has(randomIndex) && hasUniqueSolution(testPuzzle)) {
        removedCells.add(randomIndex);
      }
    }

    puzzle = puzzle.map((block, index) => ({
      ...block,
      type: removedCells.has(index) ? null : block.type,
      isLocked: !removedCells.has(index),
      isHint: false
    }));

    return puzzle;
  };

  const isValidBoard = (board: Block[]): boolean => {
    // Check rows
    for (let row = 0; row < GRID_SIZE; row++) {
      let sunCount = 0;
      let moonCount = 0;
      let consecutiveSuns = 0;
      let consecutiveMoons = 0;
      
      for (let col = 0; col < GRID_SIZE; col++) {
        const block = board[row * GRID_SIZE + col];
        
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

    // Check columns
    for (let col = 0; col < GRID_SIZE; col++) {
      let sunCount = 0;
      let moonCount = 0;
      let consecutiveSuns = 0;
      let consecutiveMoons = 0;
      
      for (let row = 0; row < GRID_SIZE; row++) {
        const block = board[row * GRID_SIZE + col];
        
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

  useEffect(() => {
    initializeBoard();
  }, [level, difficulty]);

  const initializeBoard = () => {
    const completeSolution = generateValidBoard();
    setSolution(completeSolution);
    const newPuzzle = createPuzzle(completeSolution);
    setBlocks(newPuzzle);
    setIsPuzzleSolved(false);
    setTimer(0);
    setIsActive(true);
    setMoveHistory([]);
  };

  const handleBlockClick = (id: number) => {
    setBlocks((prevBlocks: Block[]) => {
      const block = prevBlocks.find(b => b.id === id);
      if (block?.isLocked) {
        toast({
          title: "Can't modify this cell",
          description: "This cell is part of the initial puzzle",
          variant: "destructive"
        });
        return prevBlocks;
      }

      // Save the move to history
      setMoveHistory(prev => [...prev, { blockId: id, previousType: block?.type || null }]);

      const newBlocks = prevBlocks.map((block): Block =>
        block.id === id
          ? { 
              ...block, 
              type: block.type === null ? 'sun' as const : 
                    block.type === 'sun' ? 'moon' as const : null
            }
          : block
      );

      // Call checkSolution after the state update, with proper typing
      setTimeout(() => checkSolution(newBlocks), 0);
      return newBlocks;
    });
  };

  const undoLastMove = () => {
    if (moveHistory.length === 0) {
      toast({
        title: "No moves to undo",
        description: "You haven't made any moves yet",
        variant: "destructive"
      });
      return;
    }

    const lastMove = moveHistory[moveHistory.length - 1];
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === lastMove.blockId
          ? { ...block, type: lastMove.previousType }
          : block
      )
    );
    setMoveHistory(prev => prev.slice(0, -1));
  };

  const handleHint = () => {
    if (hintCooldown > 0) {
      toast({
        title: "Hint cooldown active",
        description: `Please wait ${hintCooldown} seconds before using another hint`,
        variant: "destructive"
      });
      return;
    }

    // Find an empty cell to reveal
    const emptyCells = blocks
      .map((block, index) => ({ ...block, index }))
      .filter(block => !block.isLocked && block.type === null);

    if (emptyCells.length === 0) {
      toast({
        title: "No empty cells",
        description: "All cells are already filled!",
        variant: "destructive"
      });
      return;
    }

    // Randomly select an empty cell
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const solutionCell = solution[randomCell.index];

    setBlocks(prevBlocks => 
      prevBlocks.map((block, index) => 
        index === randomCell.index
          ? { ...block, type: solutionCell.type, isLocked: true, isHint: true }
          : block
      )
    );

    // Start cooldown
    setHintCooldown(HINT_COOLDOWN);
  };

  const checkSolution = useCallback((currentBlocks: Block[]) => {
    // Check if all cells are filled
    const isComplete = currentBlocks.every(block => block.type !== null);
    
    if (isComplete) {
      console.log("Board is complete, checking solution...");
      if (isValidBoard(currentBlocks)) {
        const points = 100 * level;
        setScore((prev) => prev + points);
        setIsPuzzleSolved(true);
        setIsActive(false);
        toast({
          title: "Level Cleared! 🎉",
          description: `You earned ${points} points! Time taken: ${formatTime(timer)}`,
        });
        
        // Automatically proceed to next level after a delay
        setTimeout(() => {
          handleNextLevel();
        }, 2000);
      } else {
        toast({
          title: "Level Failed ❌",
          description: "Your solution doesn't follow the rules. Try undoing your last move.",
          variant: "destructive"
        });
      }
    }
  }, [level, timer, isValidBoard]);

  const handleNextLevel = () => {
    setLevel((prev) => prev + 1);
    toast({
      title: "Level up!",
      description: `Welcome to level ${level + 1}`,
    });
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    initializeBoard();
    toast({
      title: "Difficulty Changed",
      description: `Switched to ${newDifficulty} mode`,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-muted to-white p-4">
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-game-primary/10 text-game-primary">
            Level {level}
          </div>
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-game-accent/10 text-game-accent">
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </div>
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-game-secondary/10 text-game-secondary">
            Time: {formatTime(timer)}
          </div>
        </div>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={() => handleDifficultyChange('easy')}
            className={`px-4 py-2 rounded-full ${
              difficulty === 'easy'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 hover:bg-green-200'
            } transition-colors duration-300`}
          >
            Easy
          </button>
          <button
            onClick={() => handleDifficultyChange('medium')}
            className={`px-4 py-2 rounded-full ${
              difficulty === 'medium'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-200 hover:bg-yellow-200'
            } transition-colors duration-300`}
          >
            Medium
          </button>
          <button
            onClick={() => handleDifficultyChange('hard')}
            className={`px-4 py-2 rounded-full ${
              difficulty === 'hard'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 hover:bg-red-200'
            } transition-colors duration-300`}
          >
            Hard
          </button>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Sun & Moon Puzzle</h1>
        <p className="text-lg text-gray-600 mb-4">Score: {score}</p>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={handleHint}
            disabled={hintCooldown > 0}
            className={`px-4 py-2 rounded-full ${
              hintCooldown > 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-game-primary text-white hover:bg-game-secondary'
            } transition-colors duration-300 shadow-md`}
          >
            {hintCooldown > 0 ? `Hint (${hintCooldown}s)` : 'Hint'}
          </button>
          <button
            onClick={undoLastMove}
            disabled={moveHistory.length === 0}
            className={`px-4 py-2 rounded-full ${
              moveHistory.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            } transition-colors duration-300 shadow-md`}
          >
            Undo
          </button>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-6 gap-2 bg-white p-4 rounded-lg shadow-lg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {blocks.map((block) => (
          <GameBlock
            key={block.id}
            block={block}
            onClick={() => handleBlockClick(block.id)}
          />
        ))}
      </motion.div>

      <div className="mt-8 space-x-4">
        <button
          onClick={initializeBoard}
          className="px-6 py-2 bg-game-primary text-white rounded-full hover:bg-game-secondary transition-colors duration-300 shadow-md"
        >
          Reset Board
        </button>
      </div>
    </div>
  );
};

export default GameBoard;
