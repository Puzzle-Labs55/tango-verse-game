
import React from "react";
import { Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LevelCompletedDialogProps {
  level: number;
  stars: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
  onNextLevel: () => void;
}

export const LevelCompletedDialog: React.FC<LevelCompletedDialogProps> = ({
  level,
  stars,
  isOpen,
  onOpenChange,
  onReset,
  onNextLevel,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-600">Level Cleared!</DialogTitle>
          <DialogDescription>
            Congratulations! You've completed Level {level} with {stars} stars.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center my-4">
          <div className="flex space-x-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Sun
                key={i}
                className={`w-8 h-8 ${
                  i < stars ? "text-yellow-500" : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={onReset} variant="outline" className="w-full">
            Play Again
          </Button>
          <Button onClick={onNextLevel} className="w-full bg-green-600 hover:bg-green-700">
            Next Level
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface LevelFailedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUndo: () => void;
  onReset: () => void;
}

export const LevelFailedDialog: React.FC<LevelFailedDialogProps> = ({
  isOpen,
  onOpenChange,
  onUndo,
  onReset,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-red-600">Not Quite Right</DialogTitle>
          <DialogDescription>
            Your solution doesn't match the correct pattern. Would you like to try again?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={onUndo} variant="outline" className="w-full">
            Undo Last Move
          </Button>
          <Button onClick={onReset} className="w-full bg-blue-600 hover:bg-blue-700">
            Reset Board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
