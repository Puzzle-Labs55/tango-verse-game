import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import GameBlock from "./GameBlock";
import { toast } from "@/components/ui/use-toast";
import { Sun, Moon } from "lucide-react";
import { GameTutorial } from "./GameTutorial";
import { Block, Move, Difficulty } from "@/types/gameTypes";
import { 
  isValidBoard, 
  hasUniqueSolution, 
  checkValidMove,
  hasLogicalHint
} from "@/utils/gameRules";
import {
  generateValidBoard,
  createPuzzle
} from "@/utils/puzzleGenerator";
import {
  getLogicalExplanation,
  findHintCell
} from "@/utils/hintHelper";
import GameControls from "./GameControls";
import GameStats from "./GameStats";
import LevelDialogs from "./LevelDialogs";

const GRID_SIZE = 6;
const HINT_COOLDOWN = 20;

const DIFFICULTY_SETTINGS = {
  'easy': { cellsToRemove: 0.4, maxConsecutive: 2 },
  'medium': { cellsToRemove: 0.5, maxConsecutive: 3 },
  'hard': { cellsToRemove: 0.6, maxConsecutive: 3 },
  'very-hard': { cellsToRemove: 0.7, maxConsecutive: 3 }
};

const getDifficultyForLevel = (level: number): Difficulty => {
  const cyclePosition = (level - 1) % 5;
  
  switch (cyclePosition) {
    case 0: 
    case 1: 
      return 'easy';
    case 2: 
      return 'medium';
    case 3: 
      return 'hard';
    case 4: 
      return 'very-hard';
    default:
      return 'easy';
  }
};

const GameBoard = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [initialBlocks, setInitialBlocks] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>(getDifficultyForLevel(1));
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [solution, setSolution] = useState<Block[]>([]);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const newDifficulty = getDifficultyForLevel(level);
    setDifficulty(newDifficulty);
    initializeBoard();

    toast({
      title: `Level ${level}`,
      description: `Difficulty: ${newDifficulty.charAt(0).toUpperCase() + newDifficulty.slice(1)}`,
    });
  }, [level]);

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

  useEffect(() => {
    initializeBoard();
  }, [level, difficulty]);

  const initializeBoard = () => {
    if (initialBlocks.length === 0) {
      const completeSolution = generateValidBoard();
      setSolution(completeSolution);
      const newPuzzle = createPuzzle(completeSolution, difficulty, DIFFICULTY_SETTINGS, GRID_SIZE);
      setBlocks(newPuzzle);
      setInitialBlocks([...newPuzzle]);
    } else {
      setBlocks([...initialBlocks]);
    }
    
    setIsPuzzleSolved(false);
    setTimer(0);
    setIsActive(true);
    setMoveHistory([]);
    setHintCooldown(0);

    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('hasSeenTutorial', 'true');
    }
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

      setMoveHistory(prev => [...prev, { blockId: id, previousType: block?.type || null }]);

      const newBlocks = prevBlocks.map((block): Block =>
        block.id === id
          ? { 
              ...block, 
              type: block.type === null ? 'sun' : 
                    block.type === 'sun' ? 'moon' : null,
              isInvalid: false
            }
          : block
      );

      // Wait 500ms before checking validity
      setTimeout(() => {
        setBlocks(currentBlocks => {
          const isInvalid = checkValidMove(currentBlocks, id, GRID_SIZE);
          if (isInvalid) {
            return currentBlocks.map(block =>
              block.id === id
                ? { ...block, isInvalid: true }
                : block
            );
          }
          return currentBlocks;
        });
      }, 500);

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

    const hintCell = findHintCell(blocks, GRID_SIZE);

    if (hintCell === -1) {
      toast({
        title: "No logical hints available",
        description: "Try looking for patterns in rows and columns",
        variant: "destructive"
      });
      return;
    }

    const explanation = getLogicalExplanation(blocks, hintCell, GRID_SIZE);
    
    setBlocks(prevBlocks => 
      prevBlocks.map((block, index) => 
        index === hintCell
          ? { ...block, isHint: true }
          : block
      )
    );

    toast({
      title: "Hint",
      description: explanation,
    });

    setHintCooldown(HINT_COOLDOWN);

    setTimeout(() => {
      setBlocks(prevBlocks =>
        prevBlocks.map(block => ({ ...block, isHint: false }))
      );
    }, 3000);
  };

  const checkSolution = useCallback((currentBlocks: Block[]) => {
    const isComplete = currentBlocks.every(block => block.type !== null);
    
    if (isComplete) {
      console.log("Board is complete, checking solution...");
      if (isValidBoard(currentBlocks, GRID_SIZE)) {
        const points = 100 * level;
        setScore((prev) => prev + points);
        setIsPuzzleSolved(true);
        setIsActive(false);
        toast({
          title: "Level Cleared! 🎉",
          description: `You earned ${points} points! Time taken: ${formatTime(timer)}`,
        });
        
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
  }, [level, timer]);

  const handleNextLevel = () => {
    setLevel((prev) => prev + 1);
    setInitialBlocks([]);
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
    <>
      {showTutorial && (
        <GameTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      )}
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-muted to-white p-4">
        <GameStats 
          level={level} 
          difficulty={difficulty} 
          timer={timer} 
          score={score} 
          formatTime={formatTime}
        />

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

        <GameControls 
          hintCooldown={hintCooldown}
          moveHistory={moveHistory}
          handleHint={handleHint}
          undoLastMove={undoLastMove}
          initializeBoard={initializeBoard}
        />
      </div>
    </>
  );
};

export default GameBoard;
