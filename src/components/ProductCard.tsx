import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: any;
  setSelectedProduct: (product: any) => void;
  addToCart: (product: any, weightIdx: number, quantity: number) => void;
  getName: (item: any) => string;
  t: (key: string) => string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  setSelectedProduct,
  addToCart,
  getName,
  t
}) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="bg-[#1a1a1a] rounded-[32px] overflow-hidden relative group border border-white/5 hover:border-emerald-600/30 transition-all duration-300 shadow-xl hover:shadow-emerald-600/10"
      onClick={() => setSelectedProduct(product)}
    >
      {product.discount && (
        <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full z-10 flex items-center gap-1 shadow-lg shadow-emerald-600/20">
          <span className="uppercase tracking-tighter">Sale</span>
          <span className="w-1 h-1 bg-white rounded-full mx-0.5 opacity-50" />
          <span>{product.discount}%</span>
        </div>
      )}
      
      {product.is_limited && (
        <div className="absolute top-4 right-14 bg-amber-500 text-black text-[9px] font-black px-3 py-1.5 rounded-full z-10 uppercase tracking-widest shadow-lg shadow-amber-500/20">
          {t('limitedTime')}
        </div>
      )}

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); addToCart(product, 0, 1); }}
        className="absolute top-4 right-4 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-2xl z-10 hover:bg-emerald-600 hover:text-white transition-colors"
      >
        <Plus size={22} />
      </motion.button>

      <div className="aspect-[4/5] overflow-hidden bg-[#262626] relative">
        <img 
          src={product.image} 
          alt={getName(product)} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60" />
      </div>

      <div className="p-5">
        <h3 className="text-sm font-bold mb-3 line-clamp-2 h-10 leading-snug group-hover:text-emerald-600 transition-colors">{getName(product)}</h3>
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            {product.old_price && (
              <span className="text-[10px] text-gray-500 line-through mb-0.5 opacity-60">{product.old_price.toLocaleString()}</span>
            )}
            <span className="text-emerald-600 font-black text-base tracking-tight">
              {product.price.toLocaleString()} <span className="text-[10px] font-bold opacity-70 uppercase ml-0.5">{t('currency')}</span>
            </span>
          </div>
          <div className="text-[10px] text-gray-500 font-medium opacity-40">
            {product.weights?.[0]?.w} {t('gram')}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
