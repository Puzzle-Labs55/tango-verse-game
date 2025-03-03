
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import GameBlock from "./GameBlock";
import { toast } from "@/components/ui/use-toast";
import { GameTutorial } from "./GameTutorial";
import { supabase } from "@/lib/supabase";
import { Block, GameBoardProps } from "@/types/gameTypes";
import { checkRowRuleViolation, checkColumnRuleViolation, checkWinCondition, getDifficultyForLevel, GRID_SIZE } from "@/utils/gameRules";
import { createLogicalPuzzle } from "@/utils/puzzleGenerator";
import { generateHint, calculateStars, displayRules } from "@/utils/hintHelper";
import GameControls from "./GameControls";
import GameStats from "./GameStats";
import { LevelCompletedDialog, LevelFailedDialog } from "./LevelDialogs";

export { Block };

const GameBoard = ({ level, onLevelComplete }: GameBoardProps) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [initialBlocks, setInitialBlocks] = useState<Block[]>([]);
  const [solution, setSolution] = useState<Block[]>([]);
  const [moveHistory, setMoveHistory] = useState<Block[][]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [difficulty, setDifficulty] = useState<string>("easy");
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hintUsed, setHintUsed] = useState(0);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [showLevelCompletedDialog, setShowLevelCompletedDialog] = useState(false);
  const [showLevelFailedDialog, setShowLevelFailedDialog] = useState(false);
  const [boardFilled, setBoardFilled] = useState(false);
  
  const handleBlockClick = (index: number) => {
    if (blocks[index].isLocked) {
      toast({
        title: "Locked Block",
        description: "This block cannot be modified.",
      });
      return;
    }

    // Clone blocks array and update the target block
    const newBlocks = [...blocks];
    
    // Save current state for undo
    setMoveHistory([...moveHistory, blocks]);
    
    // Cycle through: null -> sun -> moon -> null
    let newType: "sun" | "moon" | null;
    
    if (newBlocks[index].type === null) {
      newType = "sun";
    } else if (newBlocks[index].type === "sun") {
      newType = "moon";
    } else {
      newType = null;
    }
    
    // Update block with new type
    newBlocks[index] = {
      ...newBlocks[index],
      type: newType,
    };
    
    // Validate the move against rules
    const rowIndex = Math.floor(index / GRID_SIZE);
    const colIndex = index % GRID_SIZE;
    
    let ruleViolations: string[] = [];
    
    if (checkRowRuleViolation(newBlocks, rowIndex)) {
      ruleViolations.push(`Row ${rowIndex + 1} violates puzzle rules.`);
    }
    
    if (checkColumnRuleViolation(newBlocks, colIndex)) {
      ruleViolations.push(`Column ${colIndex + 1} violates puzzle rules.`);
    }
    
    // If rules are violated, show warnings but still allow the move
    if (ruleViolations.length > 0) {
      setErrorMessages(ruleViolations);
      // Display warnings as toasts
      ruleViolations.forEach(message => {
        toast({
          title: "Rule Violation",
          description: message,
          variant: "destructive",
        });
      });
    } else {
      setErrorMessages([]);
    }
    
    setBlocks(newBlocks);
    setMoveCount(moveCount + 1);
    
    // Check if board is completely filled (no null cells)
    const isBoardFilled = !newBlocks.some(block => block.type === null);
    setBoardFilled(isBoardFilled);
    
    // If the board is filled, check if it's correct
    if (isBoardFilled) {
      const isCorrect = checkWinCondition(newBlocks, solution);
      if (isCorrect) {
        setShowLevelCompletedDialog(true);
        // Register the completion with parent component
        if (onLevelComplete) {
          onLevelComplete(level, calculateStars(moveCount, hintUsed));
        }
      } else {
        setShowLevelFailedDialog(true);
      }
    }
  };

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
    setErrorMessages([]);
    
    // Reset dialog states when undoing
    setShowLevelCompletedDialog(false);
    setShowLevelFailedDialog(false);
    setBoardFilled(false);
  };

  const showHint = () => {
    const { newBlocks, hintGiven } = generateHint(blocks);
    setBlocks(newBlocks);
    setHintUsed(hintUsed + 1);
  };

  const handleNextLevel = async () => {
    // Save completion data if needed
    const starsEarned = calculateStars(moveCount, hintUsed);
    
    // If onLevelComplete callback is provided, call it
    if (onLevelComplete) {
      onLevelComplete(level, starsEarned);
    }
    
    // Load the next level
    try {
      // Try to fetch the next level
      const { data, error } = await supabase
        .from('puzzle_levels')
        .select('id')
        .eq('id', level + 1)
        .single();
      
      if (error || !data) {
        // Create a new level if it doesn't exist
        const newDifficulty = getDifficultyForLevel(level + 1);
        const { initialState, solution } = createLogicalPuzzle(newDifficulty);
        
        // Save the new puzzle level to Supabase
        await supabase.from('puzzle_levels').upsert({
          id: level + 1,
          difficulty: newDifficulty as any,
          initial_state: initialState,
          solution: solution,
          created_at: new Date().toISOString()
        });
      }
      
      // Redirect to the new level
      window.location.href = `/?level=${level + 1}`;
      
    } catch (error) {
      console.error('Error loading next level:', error);
      toast({
        title: "Error",
        description: "Failed to load the next level. Please try again.",
        variant: "destructive",
      });
    }
    
    setShowLevelCompletedDialog(false);
  };

  const resetBoard = () => {
    setBlocks(initialBlocks);
    setMoveHistory([]);
    setMoveCount(0);
    setErrorMessages([]);
    setShowLevelFailedDialog(false);
    setShowLevelCompletedDialog(false);
    setBoardFilled(false);
    toast({
      title: "Board Reset",
      description: "The board has been reset to its initial state.",
    });
  };

  useEffect(() => {
    const fetchOrCreateLevel = async () => {
      try {
        // Try to fetch from Supabase first
        const { data, error } = await supabase
          .from('puzzle_levels')
          .select('initial_state, solution, difficulty')
          .eq('id', level)
          .single();

        if (error || !data) {
          console.log("Creating new puzzle for level", level);
          // If level doesn't exist, create a new one
          const difficultyValue = getDifficultyForLevel(level);
          const { initialState, solution } = createLogicalPuzzle(difficultyValue);
          
          // Set the board with the newly created puzzle
          setBlocks(initialState);
          setInitialBlocks(initialState);
          setSolution(solution);
          setDifficulty(difficultyValue);
          
          // Save the new puzzle to Supabase for future use
          await supabase.from('puzzle_levels').upsert({
            id: level,
            difficulty: difficultyValue as any,
            initial_state: initialState,
            solution: solution,
            created_at: new Date().toISOString()
          });
        } else {
          // Use the fetched puzzle
          setDifficulty(data.difficulty || getDifficultyForLevel(level));
          setBlocks(data.initial_state);
          setInitialBlocks(data.initial_state);
          setSolution(data.solution);
        }

        toast({
          title: `Level ${level}`,
          description: `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
        });
        
        // Display rules when loading a level
        displayRules();
      } catch (error) {
        console.error('Error fetching or creating level:', error);
        toast({
          title: "Error loading level",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    };

    fetchOrCreateLevel();
    
    // Reset state when level changes
    setMoveHistory([]);
    setMoveCount(0);
    setHintUsed(0);
    setErrorMessages([]);
    setShowLevelCompletedDialog(false);
    setShowLevelFailedDialog(false);
    setBoardFilled(false);
  }, [level]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <GameTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        Level {level} ({difficulty})
      </h1>
      
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600">Tap to cycle: empty → sun → moon → empty</p>
      </div>
      
      {errorMessages.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p className="font-bold">Rule Violations:</p>
          <ul className="list-disc pl-5">
            {errorMessages.map((message, idx) => (
              <li key={idx}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="grid grid-cols-6 gap-2 mb-4 p-4 bg-white rounded-lg shadow-md">
        {blocks.map((block, index) => (
          <GameBlock
            key={index}
            block={block}
            onClick={() => handleBlockClick(index)}
          />
        ))}
      </div>
      
      <GameControls
        onShowTutorial={() => setIsTutorialOpen(true)}
        onUndo={handleUndo}
        onShowHint={showHint}
        onReset={resetBoard}
        onShowRules={displayRules}
      />
      
      <GameStats moveCount={moveCount} hintUsed={hintUsed} />
      
      {/* Level Completed Dialog */}
      <LevelCompletedDialog
        level={level}
        stars={calculateStars(moveCount, hintUsed)}
        isOpen={showLevelCompletedDialog}
        onOpenChange={setShowLevelCompletedDialog}
        onReset={resetBoard}
        onNextLevel={handleNextLevel}
      />
      
      {/* Level Failed Dialog */}
      <LevelFailedDialog
        isOpen={showLevelFailedDialog}
        onOpenChange={setShowLevelFailedDialog}
        onUndo={handleUndo}
        onReset={resetBoard}
      />
    </div>
  );
};

export default GameBoard;
