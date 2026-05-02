
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Promotion {
  id: number;
  title: string;
  title_ar?: string;
  title_en?: string;
  title_tr?: string;
  image: string;
}

interface PromoSliderProps {
  promotions: Promotion[];
  getName: (obj: any) => string;
}

export const PromoSlider: React.FC<PromoSliderProps> = ({ promotions, getName }) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (promotions.length === 0) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promotions.length]);

  if (promotions.length === 0) return null;

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrent(prev => (prev + newDirection + promotions.length) % promotions.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 1.05
    })
  };

  return (
    <div className="relative mx-4 mt-4 rounded-[32px] overflow-hidden h-56 md:h-80 bg-[#1a1a1a] group shadow-2xl border border-white/5">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 }
          }}
          className="absolute inset-0"
        >
          <img 
            src={promotions[current].image} 
            alt={promotions[current].title} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-8 left-8 right-8 text-white"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Special Offer</span>
            </div>
            <h3 className="text-2xl md:text-4xl font-black tracking-tighter leading-none mb-2 drop-shadow-lg">
              {getName(promotions[current])}
            </h3>
            <p className="text-sm text-white/70 font-medium max-w-md hidden md:block">
              Premium quality nuts and snacks delivered fresh to your doorstep. Experience the taste of tradition.
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute inset-y-0 left-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={() => paginate(-1)}
          className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
      <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={() => paginate(1)}
          className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {promotions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > current ? 1 : -1);
              setCurrent(idx);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${current === idx ? 'bg-red-600 w-8' : 'bg-white/30 w-2'}`}
          />
        ))}
      </div>
    </div>
  );
};
