
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
      className={`w-12 h-12 md:w-16 md:h-16 cursor-pointer relative bg-white rounded-lg shadow-md 
        ${block.isLocked ? 'bg-gray-50' : 'hover:bg-gray-50'}
        ${block.isHint ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
        ${block.isInvalid ? 'bg-red-100 before:absolute before:inset-0 before:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ff000020_10px,#ff000020_20px)]' : ''}`}
      whileHover={{ scale: block.isLocked ? 1 : 1.05 }}
      whileTap={{ scale: block.isLocked ? 1 : 0.95 }}
      onClick={onClick}
      initial={{ scale: 0, rotate: 0 }}
      animate={{ 
        scale: 1, 
        rotate: block.rotation,
      }}
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
