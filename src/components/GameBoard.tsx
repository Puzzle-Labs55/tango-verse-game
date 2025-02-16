
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameBlock } from "./GameBlock";
import { toast } from "@/components/ui/use-toast";

export interface Block {
  id: number;
  color: string;
  rotation: number;
}

const COLORS = ["#9b87f5", "#7E69AB", "#D6BCFA", "#F1F0FB"];

export const GameBoard = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  useEffect(() => {
    initializeBoard();
  }, [level]);

  const initializeBoard = () => {
    const newBlocks: Block[] = Array.from({ length: 16 }, (_, index) => ({
      id: index,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.floor(Math.random() * 4) * 90,
    }));
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
      if (index % 4 !== 3) {
        return (
          block.color === blocks[index + 1]?.color &&
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
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Tango Puzzle</h1>
        <p className="text-lg text-gray-600">Score: {score}</p>
      </div>

      <motion.div
        className="grid grid-cols-4 gap-2 bg-white p-4 rounded-lg shadow-lg"
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
