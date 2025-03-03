
import React from 'react';
import { Difficulty } from '@/types/gameTypes';

interface GameStatsProps {
  level: number;
  difficulty: Difficulty;
  timer: number;
  score: number;
  formatTime: (seconds: number) => string;
}

const GameStats: React.FC<GameStatsProps> = ({
  level,
  difficulty,
  timer,
  score,
  formatTime
}) => {
  return (
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
    </div>
  );
};

export default GameStats;
