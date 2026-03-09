import React from 'react';

interface Category {
  id: string;
  icon: string;
  name?: string;
  name_ar?: string;
  name_en?: string;
  name_tr?: string;
}

interface MobileCategoriesGridProps {
  categories: Category[];
  setSelectedCategory: (id: string) => void;
  getName: (item: any) => string;
  t: (key: string) => string;
}

export const MobileCategoriesGrid: React.FC<MobileCategoriesGridProps> = ({
  categories,
  setSelectedCategory,
  getName,
  t
}) => {
  return (
    <div className="lg:hidden">
      <div className="px-4 mt-6 mb-2">
        <h2 className="text-xl font-bold">{t('manageCategories')}</h2>
      </div>
      <div className="px-4 mt-2">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex flex-col items-center gap-2 p-2 rounded-2xl transition-all bg-[#1a1a1a] hover:bg-[#262626]"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#262626]">
                <img src={cat.icon} alt={getName(cat)} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-bold text-center line-clamp-1 text-gray-400">
                {getName(cat)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
