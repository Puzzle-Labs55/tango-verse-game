
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameBlock } from "./GameBlock";
import { toast } from "@/components/ui/use-toast";
import { Sun, Moon } from "lucide-react";

export interface Block {
  id: number;
  type: 'sun' | 'moon';
  rotation: number;
}

const GRID_SIZE = 6;

export const GameBoard = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  const generateValidBoard = (): Block[] => {
    let isValid = false;
    let board: Block[] = [];

    while (!isValid) {
      // Initialize board with random suns and moons
      board = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
        id: index,
        type: Math.random() < 0.5 ? 'sun' : 'moon',
        rotation: Math.floor(Math.random() * 4) * 90,
      }));

      // Check if board is valid
      isValid = isValidBoard(board);
    }

    return board;
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
        
        // Count suns and moons in row
        if (block.type === 'sun') {
          sunCount++;
          consecutiveSuns++;
          consecutiveMoons = 0;
        } else {
          moonCount++;
          consecutiveMoons++;
          consecutiveSuns = 0;
        }
        
        // Check for consecutive pieces
        if (consecutiveSuns >= 3 || consecutiveMoons >= 3) return false;
      }
      
      // Check equal numbers in row
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
        
        // Count suns and moons in column
        if (block.type === 'sun') {
          sunCount++;
          consecutiveSuns++;
          consecutiveMoons = 0;
        } else {
          moonCount++;
          consecutiveMoons++;
          consecutiveSuns = 0;
        }
        
        // Check for consecutive pieces
        if (consecutiveSuns >= 3 || consecutiveMoons >= 3) return false;
      }
      
      // Check equal numbers in column
      if (sunCount !== moonCount) return false;
    }

    return true;
  };

  useEffect(() => {
    initializeBoard();
  }, [level]);

  const initializeBoard = () => {
    const newBlocks = generateValidBoard();
    setBlocks(newBlocks);
    setIsPuzzleSolved(false);
  };

  const handleBlockClick = (id: number) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === id
          ? { ...block, rotation: (block.rotation + 90) % 360 }
          : block
      )
    );
    checkPattern();
  };

  const checkPattern = () => {
    // Simple pattern check (can be expanded)
    const hasMatch = blocks.some((block, index) => {
      if (index % GRID_SIZE !== GRID_SIZE - 1) {
        return (
          block.type === blocks[index + 1]?.type &&
          block.rotation === blocks[index + 1]?.rotation
        );
      }
      return false;
    });

    if (hasMatch) {
      const points = 100 * level;
      setScore((prev) => prev + points);
      setIsPuzzleSolved(true);
      toast({
        title: "Pattern matched!",
        description: `You earned ${points} points!`,
      });
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
        <div className="inline-flex items-center px-4 py-1 rounded-full bg-game-primary/10 text-game-primary mb-2">
          Level {level}
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Sun & Moon Puzzle</h1>
        <p className="text-lg text-gray-600">Score: {score}</p>
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
        {isPuzzleSolved && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-6 py-2 bg-game-secondary text-white rounded-full hover:bg-game-primary transition-colors duration-300 shadow-md"
            onClick={handleNextLevel}
          >
            Next Level →
          </motion.button>
        )}
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
