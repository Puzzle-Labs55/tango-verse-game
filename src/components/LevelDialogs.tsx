
import React from 'react';

interface LevelDialogsProps {
  isPuzzleSolved: boolean;
  level: number;
  score: number;
  timer: number;
  formatTime: (seconds: number) => string;
  handleNextLevel: () => void;
}

const LevelDialogs: React.FC<LevelDialogsProps> = ({
  isPuzzleSolved,
  level,
  score,
  timer,
  formatTime,
  handleNextLevel
}) => {
  // This component is a placeholder for future level completion/failure dialogs
  // Currently toast notifications are used instead
  return null;
};

export default LevelDialogs;
