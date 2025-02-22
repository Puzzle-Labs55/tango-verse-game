import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GameBlock } from "./GameBlock";
import { toast } from "@/components/ui/use-toast";
import { Sun, Moon } from "lucide-react";
import { GameTutorial } from "./GameTutorial";

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

  const generateValidBoard = (): Block[] => {
    let isValid = false;
    let board: Block[] = [];
    let attempts = 0;
    const maxAttempts = 1000;

    while (!isValid && attempts < maxAttempts) {
      attempts++;
      board = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
        id: index,
        type: null,
        rotation: 0,
        isLocked: false,
        isHint: false
      }));

      if (fillBoardBacktrack(board, 0)) {
        isValid = true;
      }
    }

    if (!isValid) {
      console.log("Failed to generate valid board, using backup method");
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

    const types: ('sun' | 'moon')[] = ['sun', 'moon'];
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    for (const type of types) {
      board[position] = {
        ...board[position],
        type
      };

      if (isPartialBoardValid(board, row, col)) {
        if (fillBoardBacktrack(board, position + 1)) {
          return true;
        }
      }
    }

    board[position] = {
      ...board[position],
      type: null
    };
    return false;
  };

  const isPartialBoardValid = (board: Block[], row: number, col: number): boolean => {
    const rowBlocks = board.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE)
      .filter(b => b.type !== null);
    const rowSuns = rowBlocks.filter(b => b.type === 'sun').length;
    const rowMoons = rowBlocks.filter(b => b.type === 'moon').length;
    
    if (rowSuns > GRID_SIZE / 2 || rowMoons > GRID_SIZE / 2) return false;
    
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

    const colBlocks = Array.from({ length: GRID_SIZE }, (_, i) => board[i * GRID_SIZE + col])
      .filter(b => b.type !== null);
    const colSuns = colBlocks.filter(b => b.type === 'sun').length;
    const colMoons = colBlocks.filter(b => b.type === 'moon').length;
    
    if (colSuns > GRID_SIZE / 2 || colMoons > GRID_SIZE / 2) return false;
    
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

    for (let i = 0; i < board.length; i++) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;
      
      if (col >= 2) {
        const prev2 = board[i - 2].type;
        const prev1 = board[i - 1].type;
        if (prev2 === prev1 && prev1 === board[i].type) {
          board[i].type = board[i].type === 'sun' ? 'moon' : 'sun';
        }
      }
      
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
    let emptyCells = 0;
    let constrainedCells = 0;

    for (let i = 0; i < GRID_SIZE; i++) {
      const rowSuns = board.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE).filter(b => b.type === 'sun').length;
      const rowMoons = board.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE).filter(b => b.type === 'moon').length;
      
      if (rowSuns > GRID_SIZE / 2 || rowMoons > GRID_SIZE / 2) return false;
      if (rowSuns === GRID_SIZE / 2) constrainedCells += GRID_SIZE - rowSuns - rowMoons;
      if (rowMoons === GRID_SIZE / 2) constrainedCells += GRID_SIZE - rowSuns - rowMoons;

      const colSuns = board.filter((b, index) => index % GRID_SIZE === i && b.type === 'sun').length;
      const colMoons = board.filter((b, index) => index % GRID_SIZE === i && b.type === 'moon').length;
      
      if (colSuns > GRID_SIZE / 2 || colMoons > GRID_SIZE / 2) return false;
      if (colSuns === GRID_SIZE / 2) constrainedCells += GRID_SIZE - colSuns - colMoons;
      if (colMoons === GRID_SIZE / 2) constrainedCells += GRID_SIZE - colSuns - colMoons;
    }

    emptyCells = board.filter(b => b.type === null).length;

    return constrainedCells >= emptyCells;
  };

  const createPuzzle = (solution: Block[]): Block[] => {
    let puzzle = [...solution];
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const cellsToRemove = Math.floor(GRID_SIZE * GRID_SIZE * settings.cellsToRemove);
    const removedCells = new Set<number>();
  
    // Keep track of critical cells that force patterns
    const criticalHints = new Set<number>();
  
    // Ensure each row and column has at least one fixed cell
    for (let i = 0; i < GRID_SIZE; i++) {
      const rowStart = i * GRID_SIZE;
      const rowHint = rowStart + Math.floor(Math.random() * GRID_SIZE);
      criticalHints.add(rowHint);
    
      const colHint = i + (Math.floor(Math.random() * GRID_SIZE) * GRID_SIZE);
      criticalHints.add(colHint);
    }
  
    const attemptRemoveCell = (index: number): boolean => {
      if (criticalHints.has(index)) return false;
    
      const testPuzzle = puzzle.map((block, i) => ({
        ...block,
        type: i === index ? null : block.type,
        isLocked: i !== index && !removedCells.has(i)
      }));
    
      // Check if removing this cell maintains a unique solution
      // AND ensures there's at least one logical hint available
      return hasUniqueSolution(testPuzzle) && hasLogicalHint(testPuzzle);
    };
  
    while (removedCells.size < cellsToRemove) {
      const availableCells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i)
        .filter(i => !removedCells.has(i) && !criticalHints.has(i));
      
      if (availableCells.length === 0) break;
      
      // Try cells in random order
      const randomIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
    
      if (attemptRemoveCell(randomIndex)) {
        removedCells.add(randomIndex);
        puzzle[randomIndex] = { ...puzzle[randomIndex], type: null };
      }
    }

    return puzzle.map((block, index) => ({
      ...block,
      type: removedCells.has(index) ? null : block.type,
      isLocked: !removedCells.has(index),
      isHint: false
    }));
  };

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

  useEffect(() => {
    initializeBoard();
  }, [level, difficulty]);

  const initializeBoard = () => {
    if (initialBlocks.length === 0) {
      const completeSolution = generateValidBoard();
      setSolution(completeSolution);
      const newPuzzle = createPuzzle(completeSolution);
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
  }, [level, timer, isValidBoard]);

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
