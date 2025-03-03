
export type BlockType = 'sun' | 'moon' | null;

export type Difficulty = 'easy' | 'medium' | 'hard' | 'very-hard';

export interface Block {
  id: number;
  type: BlockType;
  rotation: number;
  isLocked: boolean;
  isHint: boolean;
  isInvalid?: boolean;
}

export interface Move {
  blockId: number;
  previousType: BlockType;
}

export interface DifficultySettings {
  cellsToRemove: number;
  maxConsecutive: number;
}
