import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

interface TopBannerProps {
  t: (key: string) => string;
}

export const TopBanner: React.FC<TopBannerProps> = ({ t }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="bg-red-600 text-white overflow-hidden relative z-[100]"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-4 text-xs md:text-sm font-bold">
        <Sparkles size={16} className="animate-pulse" />
        <p className="tracking-wide uppercase">
          {t('launchOffer')}: 10% {t('discount')} {t('firstOrderDiscount')}
        </p>
        <div className="hidden md:flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[10px] uppercase">
          <span>Code:</span>
          <span className="text-white">SHERDLL10</span>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
};
