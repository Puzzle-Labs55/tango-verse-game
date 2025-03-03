
import React from 'react';
import { Move } from '@/types/gameTypes';

interface GameControlsProps {
  hintCooldown: number;
  moveHistory: Move[];
  handleHint: () => void;
  undoLastMove: () => void;
  initializeBoard: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  hintCooldown,
  moveHistory,
  handleHint,
  undoLastMove,
  initializeBoard
}) => {
  return (
    <div className="mt-8 space-y-4">
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
      
      <div className="flex justify-center">
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

export default GameControls;
