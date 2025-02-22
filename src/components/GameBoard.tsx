import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GameBlock } from "./GameBlock";
import { toast } from "@/components/ui/use-toast";
import { Sun, Moon } from "lucide-react";
import { GameTutorial } from "./GameTutorial";
import { supabase } from "@/integrations/supabase/client";

export interface Block {
  id: number;
  type: 'sun' | 'moon' | null;
  rotation: number;
  isLocked: boolean;
  isHint: boolean;
  isInvalid?: boolean;
}

interface Move {
  blockId: number;
  previousType: 'sun' | 'moon' | null;
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'very-hard';

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

const getLogicalExplanation = (newBlocks: Block[], hintCell: number): string => {
  const row = Math.floor(hintCell / GRID_SIZE);
  const col = hintCell % GRID_SIZE;
  
  const rowCells = newBlocks.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE);
  const colCells = Array.from({ length: GRID_SIZE }, (_, i) => newBlocks[i * GRID_SIZE + col]);
  
  const rowSuns = rowCells.filter(b => b.type === 'sun').length;
  const rowMoons = rowCells.filter(b => b.type === 'moon').length;
  const colSuns = colCells.filter(b => b.type === 'sun').length;
  const colMoons = colCells.filter(b => b.type === 'moon').length;

  // Check for consecutive patterns
  const checkConsecutivePattern = (cells: Block[], index: number) => {
    if (index > 0 && index < cells.length - 1) {
      if (cells[index - 1].type === cells[index + 1].type) {
        return `To avoid three ${cells[index - 1].type}s in a row`;
      }
    }
    return null;
  };

  // Get row and column based explanations
  const rowPattern = checkConsecutivePattern(rowCells, col);
  const colPattern = checkConsecutivePattern(colCells, row);

  if (rowSuns === GRID_SIZE / 2) {
    return "This cell must be a moon because this row already has the maximum number of suns";
  }
  if (rowMoons === GRID_SIZE / 2) {
    return "This cell must be a sun because this row already has the maximum number of moons";
  }
  if (colSuns === GRID_SIZE / 2) {
    return "This cell must be a moon because this column already has the maximum number of suns";
  }
  if (colMoons === GRID_SIZE / 2) {
    return "This cell must be a sun because this column already has the maximum number of moons";
  }
  if (rowPattern) {
    return rowPattern;
  }
  if (colPattern) {
    return colPattern;
  }

  return "This cell's value can be deduced from the surrounding pattern";
};

const hasLogicalHint = (board: Block[]): boolean => {
  const emptyCells = board
    .map((block, index) => ({ ...block, index }))
    .filter(block => !block.isLocked && block.type === null);

  for (const cell of emptyCells) {
    const row = Math.floor(cell.index / GRID_SIZE);
    const col = cell.index % GRID_SIZE;
    
    // Check rows
    const rowCells = board.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE);
    const rowSuns = rowCells.filter(b => b.type === 'sun').length;
    const rowMoons = rowCells.filter(b => b.type === 'moon').length;
    
    // Check columns
    const colCells = Array.from({ length: GRID_SIZE }, (_, i) => board[i * GRID_SIZE + col]);
    const colSuns = colCells.filter(b => b.type === 'sun').length;
    const colMoons = colCells.filter(b => b.type === 'moon').length;

    // Check consecutive patterns
    const hasConsecutive = (cells: Block[], index: number) => {
      if (index > 0 && index < cells.length - 1) {
        if (cells[index - 1].type === cells[index + 1].type) {
          return true;
        }
      }
      return false;
    };

    // If any constraint is found, there's a logical hint
    if (rowSuns === GRID_SIZE / 2 || rowMoons === GRID_SIZE / 2 ||
        colSuns === GRID_SIZE / 2 || colMoons === GRID_SIZE / 2 ||
        hasConsecutive(rowCells, col) || hasConsecutive(colCells, row)) {
      return true;
    }
  }

  return false;
};

export const GameBoard = () => {
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
          setBlocks(data.initial_state);
          setInitialBlocks(data.initial_state);
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
              type: block.type === null ? 'sun' as const : 
                    block.type === 'sun' ? 'moon' as const : null,
              isInvalid: false
            }
          : block
      );

      // Wait 500ms before checking validity
      setTimeout(() => {
        setBlocks(currentBlocks => {
          const isInvalid = checkValidMove(currentBlocks, id);
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

    let hintCell = -1;
    for (const cell of emptyCells) {
      const row = Math.floor(cell.index / GRID_SIZE);
      const col = cell.index % GRID_SIZE;
      
      const rowCells = blocks.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE);
      const rowSuns = rowCells.filter(b => b.type === 'sun').length;
      const rowMoons = rowCells.filter(b => b.type === 'moon').length;
      
      const colCells = Array.from({ length: GRID_SIZE }, (_, i) => blocks[i * GRID_SIZE + col]);
      const colSuns = colCells.filter(b => b.type === 'sun').length;
      const colMoons = colCells.filter(b => b.type === 'moon').length;

      const hasConsecutiveSuns = checkConsecutive(rowCells, 'sun') || checkConsecutive(colCells, 'sun');
      const hasConsecutiveMoons = checkConsecutive(rowCells, 'moon') || checkConsecutive(colCells, 'moon');

      if (rowSuns === GRID_SIZE / 2 || colSuns === GRID_SIZE / 2 ||
          rowMoons === GRID_SIZE / 2 || colMoons === GRID_SIZE / 2 ||
          hasConsecutiveSuns || hasConsecutiveMoons) {
        hintCell = cell.index;
        break;
      }
    }

    if (hintCell === -1) {
      toast({
        title: "No logical hints available",
        description: "Try looking for patterns in rows and columns",
        variant: "destructive"
      });
      return;
    }

    const explanation = getLogicalExplanation(blocks, hintCell);
    
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

  const checkConsecutive = (cells: Block[], type: 'sun' | 'moon'): boolean => {
    let consecutive = 0;
    for (const cell of cells) {
      if (cell.type === type) {
        consecutive++;
        if (consecutive === 2) return true;
      } else {
        consecutive = 0;
      }
    }
    return false;
  };

  const checkValidMove = (newBlocks: Block[], changedIndex: number): boolean => {
    const row = Math.floor(changedIndex / GRID_SIZE);
    const col = changedIndex % GRID_SIZE;
    
    // Get row and column cells
    const rowCells = newBlocks.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE);
    const colCells = Array.from({ length: GRID_SIZE }, (_, i) => newBlocks[i * GRID_SIZE + col]);
    
    // Count suns and moons in row and column
    const rowSuns = rowCells.filter(b => b.type === 'sun').length;
    const rowMoons = rowCells.filter(b => b.type === 'moon').length;
    const colSuns = colCells.filter(b => b.type === 'sun').length;
    const colMoons = colCells.filter(b => b.type === 'moon').length;
    
    // Check for three consecutive same types
    let hasConsecutive = false;
    const checkConsecutive = (cells: Block[]) => {
      let consecutiveSuns = 0;
      let consecutiveMoons = 0;
      
      for (const cell of cells) {
        if (cell.type === 'sun') {
          consecutiveSuns++;
          consecutiveMoons = 0;
        } else if (cell.type === 'moon') {
          consecutiveMoons++;
          consecutiveSuns = 0;
        } else {
          consecutiveSuns = 0;
          consecutiveMoons = 0;
        }
        
        if (consecutiveSuns >= 3 || consecutiveMoons >= 3) {
          return true;
        }
      }
      return false;
    };
    
    hasConsecutive = checkConsecutive(rowCells) || checkConsecutive(colCells);
    
    // Return true if any rule is violated
    return (rowSuns > GRID_SIZE / 2 || rowMoons > GRID_SIZE / 2 ||
            colSuns > GRID_SIZE / 2 || colMoons > GRID_SIZE / 2 ||
            hasConsecutive);
  };

  const checkSolution = useCallback((currentBlocks: Block[]) => {
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

  const isValidBoard = (board: Block[]): boolean => {
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

  const initializeBoard = () => {
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

  return (
    <>
      {showTutorial && (
        <GameTutorial onClose={() => setShowTutorial(false)} />
      )}
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
    </>
  );
};

export default GameBoard;
