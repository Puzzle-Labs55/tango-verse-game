
export interface Block {
  id: number;
  type: "sun" | "moon" | null;
  rotation: number;
  isLocked: boolean;
  isHint: boolean;
}

export interface GameBoardProps {
  level: number;
  onLevelComplete?: (level: number, stars: number) => void;
}
