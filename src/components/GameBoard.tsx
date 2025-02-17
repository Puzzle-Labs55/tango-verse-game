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

const GRID_SIZE = 6;
const HINT_COOLDOWN = 20; // seconds

export const GameBoard = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
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

    while (!isValid) {
      board = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
        id: index,
        type: Math.random() < 0.5 ? 'sun' : 'moon',
        rotation: 0,
        isLocked: false,
        isHint: false
      }));

      isValid = isValidBoard(board);
    }

    return board;
  };

  const createPuzzle = (solution: Block[]): Block[] => {
    let puzzle = [...solution];
    
    const cellsToRemove = Math.floor(GRID_SIZE * GRID_SIZE * 0.6);
    const removedCells = new Set<number>();
    
    while (removedCells.size < cellsToRemove) {
      const randomIndex = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
      if (!removedCells.has(randomIndex)) {
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
  }, [level]);

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
    setBlocks((prevBlocks) => {
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

      return prevBlocks.map((block) =>
        block.id === id
          ? { 
              ...block, 
              type: block.type === null ? 'sun' : 
                    block.type === 'sun' ? 'moon' : null 
            }
          : block
      );
    });
    checkSolution();
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

  const checkSolution = () => {
    // Check if all cells are filled
    const isComplete = blocks.every(block => block.type !== null);
    
    if (isComplete) {
      if (isValidBoard(blocks)) {
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
  };

  const handleNextLevel = () => {
    setLevel((prev) => prev + 1);
    toast({
      title: "Level up!",
      description: `Welcome to level ${level + 1}`,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-muted to-white p-4">
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-game-primary/10 text-game-primary">
            Level {level}
          </div>
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-game-secondary/10 text-game-secondary">
            Time: {formatTime(timer)}
          </div>
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
