
import React from "react";
import { motion } from "framer-motion";
import { Block } from "@/types/gameTypes";
import { Sun, Moon } from "lucide-react";

interface GameBlockProps {
  block: Block;
  onClick: () => void;
}

export const GameBlock: React.FC<GameBlockProps> = ({ block, onClick }) => {
  return (
    <motion.div
      className={`w-12 h-12 md:w-16 md:h-16 cursor-pointer relative rounded-lg shadow-md 
        ${block.isLocked ? 'bg-gray-50' : 'hover:bg-gray-50'}
        ${block.isHint ? 'bg-yellow-100 ring-2 ring-yellow-400 animate-pulse' : 'bg-white'}`}
      whileHover={{ scale: block.isLocked ? 1 : 1.05 }}
      whileTap={{ scale: block.isLocked ? 1 : 0.95 }}
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {block.type === 'sun' && (
          <Sun 
            className={`w-8 h-8 ${
              block.isLocked 
                ? block.isHint 
                  ? 'text-yellow-500'
                  : 'text-[#F97316]' 
                : 'text-[#FFA500]'
            }`}
            strokeWidth={2.5}
          />
        )}
        {block.type === 'moon' && (
          <Moon 
            className={`w-8 h-8 ${
              block.isLocked 
                ? block.isHint 
                  ? 'text-yellow-500'
                  : 'text-[#8B5CF6]' 
                : 'text-[#A78BFA]'
            }`}
            strokeWidth={2.5}
          />
        )}
      </div>
    </motion.div>
  );
};

export default GameBlock;
