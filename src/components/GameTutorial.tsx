
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Sun, Moon, X, ArrowRight } from "lucide-react";
import { Card } from "./ui/card";

interface GameTutorialProps {
  onClose: () => void;
}

export const GameTutorial: React.FC<GameTutorialProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Welcome to Sun & Moon Puzzle!",
      content: "Let's learn how to play this exciting puzzle game.",
      animation: (
        <motion.div
          className="flex gap-4 items-center justify-center py-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Sun className="w-12 h-12 text-[#FDA161]" />
          <Moon className="w-12 h-12 text-[#B8BCC0]" />
        </motion.div>
      ),
    },
    {
      title: "Basic Rules",
      content: "Fill the grid with Sun and Moon symbols. Each row and column must have an equal number of Suns and Moons.",
      animation: (
        <motion.div className="grid grid-cols-4 gap-2 p-4">
          {Array(4).fill(null).map((_, i) => (
            <motion.div
              key={i}
              className="w-12 h-12 bg-white rounded-lg flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {i % 2 === 0 ? (
                <Sun className="w-8 h-8 text-[#FDA161]" />
              ) : (
                <Moon className="w-8 h-8 text-[#B8BCC0]" />
              )}
            </motion.div>
          ))}
        </motion.div>
      ),
    },
    {
      title: "No Three in a Row",
      content: "Avoid placing three or more of the same symbol consecutively in any row or column.",
      animation: (
        <motion.div className="flex flex-col gap-2 items-center py-4">
          <div className="flex gap-2">
            {[Sun, Sun, Sun].map((Icon, i) => (
              <motion.div
                key={i}
                className="w-12 h-12 bg-white rounded-lg flex items-center justify-center"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
              >
                <Icon className="w-8 h-8 text-[#FDA161]" />
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-red-500 mt-2"
          >
            ✗ Not Allowed
          </motion.div>
        </motion.div>
      ),
    },
    {
      title: "Use Hints Wisely",
      content: "If you're stuck, you can use hints - but they have a cooldown period!",
      animation: (
        <motion.div
          className="flex flex-col items-center gap-4 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Button
            variant="outline"
            className="bg-game-primary text-white hover:bg-game-secondary transition-colors duration-300"
          >
            Hint
          </Button>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-sm text-gray-600"
          >
            20s cooldown
          </motion.div>
        </motion.div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <motion.h2
              key={step}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-2xl font-bold text-gray-800"
            >
              {tutorialSteps[step].title}
            </motion.h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[200px] flex flex-col items-center"
            >
              {tutorialSteps[step].animation}
              <p className="text-gray-600 text-center mt-4">
                {tutorialSteps[step].content}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                if (step === tutorialSteps.length - 1) {
                  onClose();
                } else {
                  setStep((s) => s + 1);
                }
              }}
            >
              {step === tutorialSteps.length - 1 ? (
                "Start Playing"
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
