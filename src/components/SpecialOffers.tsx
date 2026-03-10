import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  name_tr?: string;
  price: number;
  old_price?: number;
  image: string;
  discount?: number;
}

interface SpecialOffersProps {
  products: Product[];
  setSelectedProduct: (product: any) => void;
  getName: (item: any) => string;
  language: string;
  t: (key: string) => string;
}

export const SpecialOffers: React.FC<SpecialOffersProps> = ({
  products,
  setSelectedProduct,
  getName,
  language,
  t
}) => {
  const discountedProducts = products.filter(p => p.discount && p.discount > 0).slice(0, 8);

  if (discountedProducts.length === 0) return null;

  return (
    <div className="mt-16 px-4">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center text-emerald-600">
              <Sparkles size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{t('specialOffers')}</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{t('limitedTimeOffers')}</h2>
        </div>
        <div className="flex gap-2 mb-1">
          <button className="w-10 h-10 bg-[#1a1a1a] border border-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-emerald-600/50 transition-all">
            {language === 'en' || language === 'tr' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </button>
          <button className="w-10 h-10 bg-[#1a1a1a] border border-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-emerald-600/50 transition-all">
            {language === 'en' || language === 'tr' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 hide-scrollbar snap-x">
        {discountedProducts.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ y: -8 }}
            className="min-w-[280px] bg-[#1a1a1a] rounded-[40px] overflow-hidden snap-start border border-white/5 group relative shadow-2xl hover:shadow-emerald-600/10 transition-all duration-500"
            onClick={() => setSelectedProduct(product)}
          >
            <div className="absolute top-5 left-5 z-10 bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-600/30 uppercase tracking-tighter">
              -{product.discount}% OFF
            </div>
            <div className="aspect-[4/5] overflow-hidden bg-[#262626] relative">
              <img 
                src={product.image} 
                alt={getName(product)} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-80" />
            </div>
            <div className="p-6">
              <h3 className="font-black text-base mb-3 line-clamp-1 tracking-tight group-hover:text-emerald-600 transition-colors">{getName(product)}</h3>
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 line-through mb-0.5 opacity-50">{product.old_price?.toLocaleString()}</span>
                  <span className="text-xl font-black text-emerald-600 tracking-tighter">
                    {product.price.toLocaleString()} <span className="text-[10px] font-bold opacity-60 uppercase ml-0.5">{t('currency')}</span>
                  </span>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, x: language === 'en' || language === 'tr' ? 5 : -5 }}
                  className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-lg"
                >
                  <ArrowRight size={20} className={language === 'en' || language === 'tr' ? '' : 'rotate-180'} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
