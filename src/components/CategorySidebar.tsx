import React from 'react';
import { Grid } from 'lucide-react';

interface CategorySidebarProps {
  isSearching: boolean;
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  categories: any[];
  getName: (item: any) => string;
  t: (key: string) => string;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  isSearching,
  selectedCategory,
  setSelectedCategory,
  categories,
  getName,
  t
}) => {
  if (isSearching) return null;

  return (
    <aside className="hidden lg:block w-64 flex-shrink-0 pt-6 px-4">
      <div className="bg-[#1a1a1a] rounded-3xl p-6 sticky top-20">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Grid size={24} className="text-red-600" />
          {t('manageCategories')}
        </h2>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`w-full text-right px-4 py-3 rounded-xl transition-all font-medium ${!selectedCategory ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-400 hover:bg-white/5'}`}
          >
            {t('all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full text-right px-4 py-3 rounded-xl transition-all font-medium flex items-center justify-between gap-3 ${selectedCategory === cat.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <span className="line-clamp-1">{getName(cat)}</span>
              <img src={cat.icon} className="w-6 h-6 rounded-md object-cover" alt="" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
