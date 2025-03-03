
import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface GameControlsProps {
  onShowTutorial: () => void;
  onUndo: () => void;
  onShowHint: () => void;
  onReset: () => void;
  onShowRules: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onShowTutorial,
  onUndo,
  onShowHint,
  onReset,
  onShowRules,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 w-full max-w-md mt-4">
      <Button
        className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-2 shadow-md"
        onClick={onShowTutorial}
      >
        <HelpCircle size={16} />
        How to Play
      </Button>
      <Button
        className="px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md"
        onClick={onUndo}
      >
        Undo
      </Button>
      <Button
        className="px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-md"
        onClick={onShowHint}
      >
        Hint
      </Button>
      <Button
        className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 shadow-md"
        onClick={onReset}
      >
        Reset
      </Button>
      <Button
        className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
        onClick={onShowRules}
      >
        Rules
      </Button>
    </div>
  );
};

export default GameControls;
