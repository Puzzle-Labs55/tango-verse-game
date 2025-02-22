import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GameBlock } from "./GameBlock";
import { toast } from "@/components/ui/use-toast";
import { Sun, Moon } from "lucide-react";
import { GameTutorial } from "./GameTutorial";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export interface Block {
  id: number;
  type: "sun" | "moon" | null;
  rotation: number;
  isLocked: boolean;
  isHint: boolean;
}

interface GameBoardProps {
  level: number;
}

const GRID_SIZE = 6;

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

export const GameBoard = ({ level }: GameBoardProps) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [initialBlocks, setInitialBlocks] = useState<Block[]>([]);
  const [solution, setSolution] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [difficulty, setDifficulty] = useState<string>("easy");

  const rotateBlock = (index: number) => {
    if (blocks[index].isLocked) {
      toast({
        title: "Locked Block",
        description: "This block cannot be rotated.",
      });
      return;
    }

    const newBlocks = [...blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      rotation: (newBlocks[index].rotation + 90) % 360,
    };
    setBlocks(newBlocks);
    setMoveCount(moveCount + 1);
  };

  const handleBlockClick = (index: number) => {
    rotateBlock(index);
  };

  const checkWinCondition = useCallback(() => {
    if (blocks.length === 0 || solution.length === 0) return false;

    for (let i = 0; i < blocks.length; i++) {
      if (
        blocks[i].type !== solution[i].type ||
        blocks[i].rotation !== solution[i].rotation
      ) {
        return false;
      }
    }
    return true;
  }, [blocks, solution]);

  useEffect(() => {
    if (checkWinCondition()) {
      toast({
        title: "Congratulations!",
        description: `You solved the puzzle in ${moveCount} moves.`,
      });
    }
  }, [checkWinCondition, moveCount]);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        const { data, error } = await supabase
          .from('puzzle_levels')
          .select('initial_state, solution')
          .eq('id', level)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setBlocks(data.initial_state as Block[]);
          setInitialBlocks(data.initial_state as Block[]);
          setSolution(data.solution as Block[]);
        }

        const newDifficulty = getDifficultyForLevel(level);
        setDifficulty(newDifficulty);

        toast({
          title: `Level ${level}`,
          description: `Difficulty: ${newDifficulty.charAt(0).toUpperCase() + newDifficulty.slice(1)}`,
        });
      } catch (error) {
        console.error('Error fetching level:', error);
        toast({
          title: "Error loading level",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    };

    fetchLevel();
  }, [level]);

  const resetBoard = () => {
    setBlocks(initialBlocks);
    setMoveCount(0);
    toast({
      title: "Board Reset",
      description: "The board has been reset to its initial state.",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <GameTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
      <h1 className="text-3xl font-bold mb-4">
        Level {level} ({difficulty})
      </h1>
      <div className="grid grid-cols-6 gap-2">
        {blocks.map((block, index) => (
          <GameBlock
            key={index}
            block={block}
            onClick={() => handleBlockClick(index)}
            isSelected={selectedBlock === index}
          />
        ))}
      </div>
      <div className="flex justify-between w-full max-w-md mt-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setIsTutorialOpen(true)}
        >
          How to Play
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
          onClick={resetBoard}
        >
          Reset Board
        </button>
      </div>
      <p className="mt-4">Moves: {moveCount}</p>
    </div>
  );
};

export default GameBoard;
