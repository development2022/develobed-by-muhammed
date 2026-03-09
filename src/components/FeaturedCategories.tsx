import React from 'react';
import { motion } from 'motion/react';

interface Category {
  id: string;
  icon: string;
  name?: string;
  name_ar?: string;
  name_en?: string;
  name_tr?: string;
}

interface FeaturedCategoriesProps {
  categories: Category[];
  setSelectedCategory: (id: string) => void;
  getName: (item: any) => string;
  t: (key: string) => string;
}

export const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({
  categories,
  setSelectedCategory,
  getName,
  t
}) => {
  const featured = categories.slice(0, 4);

  return (
    <div className="hidden lg:block mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('featuredCategories')}</h2>
      </div>
      <div className="grid grid-cols-4 gap-6">
        {featured.map((cat, index) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedCategory(cat.id)}
            className="group relative h-48 rounded-[32px] overflow-hidden bg-[#1a1a1a] border border-white/5"
          >
            <img 
              src={cat.icon} 
              alt={getName(cat)} 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-right">
              <span className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1 block opacity-0 group-hover:opacity-100 transition-opacity">
                {t('explore')}
              </span>
              <h3 className="text-xl font-bold text-white">{getName(cat)}</h3>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
