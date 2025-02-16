
import React from "react";
import { motion } from "framer-motion";
import { Block } from "./GameBoard";

interface GameBlockProps {
  block: Block;
  onClick: () => void;
}

export const GameBlock: React.FC<GameBlockProps> = ({ block, onClick }) => {
  return (
    <motion.div
      className="w-16 h-16 md:w-20 md:h-20 cursor-pointer relative"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      initial={{ scale: 0, rotate: 0 }}
      animate={{ 
        scale: 1, 
        rotate: block.rotation,
        backgroundColor: block.color 
      }}
      transition={{ duration: 0.3 }}
      style={{
        borderRadius: "12px",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-8 bg-white/30 rounded" />
      </div>
    </motion.div>
  );
};

export default GameBlock;
