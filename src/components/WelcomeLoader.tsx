import React from 'react';
import { motion } from 'motion/react';

interface WelcomeLoaderProps {
  appLogo?: string;
}

export const WelcomeLoader: React.FC<WelcomeLoaderProps> = ({ appLogo }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[200] bg-[#0f0f0f] flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-32 h-32 bg-emerald-600 rounded-[40px] overflow-hidden flex items-center justify-center shadow-2xl shadow-emerald-600/20">
          {appLogo ? (
            <img src={appLogo} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-5xl">S</span>
          )}
        </div>
        
        {/* Pulsing Ring */}
        <motion.div
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 border-4 border-emerald-600 rounded-[40px]"
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <h1 className="text-2xl font-bold tracking-tight">چەرەزاتی شێردڵ</h1>
        <p className="text-gray-500 text-sm mt-2">کوالێتی و متمانە</p>
      </motion.div>

      <div className="absolute bottom-12">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              className="w-2 h-2 bg-emerald-600 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
