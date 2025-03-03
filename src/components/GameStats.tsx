
import React from "react";

interface GameStatsProps {
  moveCount: number;
  hintUsed: number;
}

export const GameStats: React.FC<GameStatsProps> = ({ moveCount, hintUsed }) => {
  return (
    <div className="mt-4 text-center p-2 bg-white rounded-lg shadow-sm">
      <p className="font-medium">Moves: {moveCount} | Hints: {hintUsed}</p>
    </div>
  );
};

export default GameStats;
