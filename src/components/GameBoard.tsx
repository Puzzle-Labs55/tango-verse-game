
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
  const [selectedType, setSelectedType] = useState<"sun" | "moon" | null>(null);
  const [moveHistory, setMoveHistory] = useState<Block[][]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [difficulty, setDifficulty] = useState<string>("easy");

  const handleBlockClick = (index: number) => {
    if (blocks[index].isLocked) {
      toast({
        title: "Locked Block",
        description: "This block cannot be modified.",
      });
      return;
    }

    if (selectedType === null) {
      toast({
        title: "Select a Symbol",
        description: "Please select either Sun or Moon first.",
      });
      return;
    }

    const newBlocks = [...blocks];
    setMoveHistory([...moveHistory, blocks]);
    newBlocks[index] = {
      ...newBlocks[index],
      type: selectedType,
    };
    setBlocks(newBlocks);
    setMoveCount(moveCount + 1);
  };

  const checkWinCondition = useCallback(() => {
    if (blocks.length === 0 || solution.length === 0) return false;

    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].type !== solution[i].type) {
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
  };

  const showHint = () => {
    const unsolvedIndices = blocks.reduce((acc: number[], block, index) => {
      if (!block.isLocked && block.type !== solution[index].type) {
        acc.push(index);
      }
      return acc;
    }, []);

    if (unsolvedIndices.length === 0) {
      toast({
        title: "No Hints Available",
        description: "You've solved all the blocks correctly!",
      });
      return;
    }

    const randomIndex = unsolvedIndices[Math.floor(Math.random() * unsolvedIndices.length)];
    const newBlocks = [...blocks];
    newBlocks[randomIndex] = {
      ...newBlocks[randomIndex],
      isHint: true,
      type: solution[randomIndex].type,
    };
    setBlocks(newBlocks);
    
    toast({
      title: "Hint Revealed",
      description: "A correct piece has been revealed.",
    });
  };

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
          const initialStateWithNulls = data.initial_state.map((block: Block) => ({
            ...block,
            type: block.isLocked ? block.type : null,
          }));
          
          setBlocks(initialStateWithNulls);
          setInitialBlocks(initialStateWithNulls);
          setSolution(data.solution);
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
    setMoveHistory([]);
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
      <div className="flex gap-4 mb-4">
        <button
          className={`p-4 rounded-lg ${
            selectedType === 'sun' ? 'bg-yellow-200' : 'bg-white'
          }`}
          onClick={() => setSelectedType('sun')}
        >
          <Sun className="w-8 h-8 text-[#FDA161]" />
        </button>
        <button
          className={`p-4 rounded-lg ${
            selectedType === 'moon' ? 'bg-yellow-200' : 'bg-white'
          }`}
          onClick={() => setSelectedType('moon')}
        >
          <Moon className="w-8 h-8 text-[#B8BCC0]" />
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {blocks.map((block, index) => (
          <GameBlock
            key={index}
            block={block}
            onClick={() => handleBlockClick(index)}
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
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          onClick={handleUndo}
        >
          Undo
        </button>
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          onClick={showHint}
        >
          Hint
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
