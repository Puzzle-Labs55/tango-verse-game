
import React from "react";
import { motion } from "framer-motion";
import { Block } from "./GameBoard";
import { Sun, Moon } from "lucide-react";

interface GameBlockProps {
  block: Block;
  onClick: () => void;
}

export const GameBlock: React.FC<GameBlockProps> = ({ block, onClick }) => {
  return (
    <motion.div
      className="w-12 h-12 md:w-16 md:h-16 cursor-pointer relative bg-white rounded-lg shadow-md"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      initial={{ scale: 0, rotate: 0 }}
      animate={{ 
        scale: 1, 
        rotate: block.rotation,
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {block.type === 'sun' ? (
          <Sun className="w-8 h-8 text-[#F97316]" />
        ) : (
          <Moon className="w-8 h-8 text-[#8E9196]" />
        )}
      </div>
    </motion.div>
  );
};

export default GameBlock;
