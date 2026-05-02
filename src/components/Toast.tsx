
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  message: string;
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div 
        initial={{ y: 100, opacity: 0, x: '-50%' }}
        animate={{ y: 0, opacity: 1, x: '-50%' }}
        exit={{ y: 100, opacity: 0, x: '-50%' }}
        className="fixed bottom-24 left-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg"
      >
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);
