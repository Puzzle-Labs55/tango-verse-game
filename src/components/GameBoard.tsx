import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GameBlock } from "./GameBlock";
import { toast } from "@/components/ui/use-toast";
import { Sun, Moon } from "lucide-react";
import { GameTutorial } from "./GameTutorial";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

interface Block {
  id: number;
  type: "sun" | "moon" | null;
  rotation: number;
  isLocked: boolean;
  isHint: boolean;
}

const GRID_SIZE = 6;

const generateValidBoard = (): Block[] => {
  let board: Block[] = [];
  let placedSun = false;
  let placedMoon = false;

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    board.push({
      id: i,
      type: null,
      rotation: 0,
      isLocked: false,
      isHint: false,
    });
  }

  // Function to get valid neighbors for a given block
  const getValidNeighbors = (index: number): number[] => {
    const neighbors: number[] = [];
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;

    // Check top
    if (row > 0) neighbors.push(index - GRID_SIZE);
    // Check bottom
    if (row < GRID_SIZE - 1) neighbors.push(index + GRID_SIZE);
    // Check left
    if (col > 0) neighbors.push(index - 1);
    // Check right
    if (col < GRID_SIZE - 1) neighbors.push(index + 1);

    return neighbors;
  };

  // Place initial Sun and Moon
  let sunIndex = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
  board[sunIndex] = { ...board[sunIndex], type: "sun" };
  placedSun = true;

  let moonIndex = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
  while (moonIndex === sunIndex) {
    moonIndex = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
  }
  board[moonIndex] = { ...board[moonIndex], type: "moon" };
  placedMoon = true;

  // Fill the rest of the board
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    if (board[i].type === null) {
      const neighbors = getValidNeighbors(i);
      let sunCount = 0;
      let moonCount = 0;

      neighbors.forEach((neighborIndex) => {
        if (board[neighborIndex].type === "sun") sunCount++;
        if (board[neighborIndex].type === "moon") moonCount++;
      });

      // Determine block type based on neighbor count
      if (sunCount > moonCount) {
        board[i] = { ...board[i], type: "sun" };
        placedSun = true;
      } else if (moonCount > sunCount) {
        board[i] = { ...board[i], type: "moon" };
        placedMoon = true;
      } else {
        // If counts are equal, randomly assign a type
        const type = Math.random() > 0.5 ? "sun" : "moon";
        board[i] = { ...board[i], type: type };
        if (type === "sun") placedSun = true;
        else placedMoon = true;
      }
    }
  }

  // Ensure at least one Sun and one Moon are placed
  if (!placedSun) {
    const emptyBlocks = board.filter((block) => block.type === null);
    if (emptyBlocks.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyBlocks.length);
      board[emptyBlocks[randomIndex].id] = {
        ...board[emptyBlocks[randomIndex].id],
        type: "sun",
      };
    } else {
      const randomIndex = Math.floor(Math.random() * board.length);
      board[randomIndex] = { ...board[randomIndex], type: "sun" };
    }
  }

  if (!placedMoon) {
    const emptyBlocks = board.filter((block) => block.type === null);
    if (emptyBlocks.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyBlocks.length);
      board[emptyBlocks[randomIndex].id] = {
        ...board[emptyBlocks[randomIndex].id],
        type: "moon",
      };
    } else {
      const randomIndex = Math.floor(Math.random() * board.length);
      board[randomIndex] = { ...board[randomIndex], type: "moon" };
    }
  }

  return board;
};

const createPuzzle = (solution: Block[], difficulty: string): Block[] => {
  let puzzle = solution.map((block) => ({ ...block })); // Deep copy

  const applyDifficulty = (
    puzzle: Block[],
    difficulty: string
  ): Block[] => {
    let hintCount: number;
    let lockedCount: number;

    switch (difficulty) {
      case "easy":
        hintCount = 7;
        lockedCount = 4;
        break;
      case "medium":
        hintCount = 5;
        lockedCount = 6;
        break;
      case "hard":
        hintCount = 3;
        lockedCount = 8;
        break;
      case "very-hard":
        hintCount = 1;
        lockedCount = 10;
        break;
      default:
        hintCount = 6;
        lockedCount = 5;
        break;
    }

    // Apply hints
    let hintIndices: number[] = [];
    while (hintIndices.length < hintCount) {
      const index = Math.floor(Math.random() * puzzle.length);
      if (!hintIndices.includes(index)) {
        hintIndices.push(index);
      }
    }

    hintIndices.forEach((index) => {
      puzzle[index] = { ...puzzle[index], isHint: true };
    });

    // Apply locks
    let lockIndices: number[] = [];
    while (lockIndices.length < lockedCount) {
      const index = Math.floor(Math.random() * puzzle.length);
      if (!lockIndices.includes(index) && !puzzle[index].isHint) {
        lockIndices.push(index);
      }
    }

    lockIndices.forEach((index) => {
      puzzle[index] = { ...puzzle[index], isLocked: true };
    });

    // Clear non-hint and non-locked blocks
    puzzle = puzzle.map((block) => {
      if (!block.isHint && !block.isLocked) {
        return { ...block, type: null, rotation: 0 };
      }
      return block;
    });

    return puzzle;
  };

  puzzle = applyDifficulty(puzzle, difficulty);
  return puzzle;
};

interface GameBoardProps {
  level: number;
}

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
          .from("puzzle_levels")
          .select("initial_state, solution")
          .eq("id", level)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          // Type assertion to ensure the JSON data matches our Block[] type
          setBlocks(data.initial_state as Block[]);
          setInitialBlocks(data.initial_state as Block[]);
          setSolution(data.solution as Block[]);
        }

        const newDifficulty = getDifficultyForLevel(level);
        setDifficulty(newDifficulty);

        toast({
          title: `Level ${level}`,
          description: `Difficulty: ${
            newDifficulty.charAt(0).toUpperCase() + newDifficulty.slice(1)
          }`,
        });
      } catch (error) {
        console.error("Error fetching level:", error);
        toast({
          title: "Error loading level",
          description: "Please try again later",
          variant: "destructive",
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
