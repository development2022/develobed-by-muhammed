import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

interface ProductDetailModalProps {
  selectedProduct: any;
  setSelectedProduct: (product: any) => void;
  addToCart: (product: any, weightIdx: number, quantity: number) => void;
  language: string;
  t: (key: string) => string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  selectedProduct,
  setSelectedProduct,
  addToCart,
  language,
  t
}) => {
  return (
    <AnimatePresence>
      {selectedProduct && (
        <motion.div 
          initial={{ x: language === 'en' || language === 'tr' ? '100%' : '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: language === 'en' || language === 'tr' ? '100%' : '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[60] bg-[#0f0f0f] flex flex-col"
          dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-white/10 rounded-full">
              {language === 'en' || language === 'tr' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </button>
            <h2 className="font-bold">{selectedProduct.name}</h2>
            <button className="p-2 hover:bg-white/10 rounded-full">
              <Heart size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="aspect-square bg-white relative">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              {selectedProduct.is_limited && (
                <div className="absolute top-4 right-4 bg-amber-500 text-black text-[10px] font-black px-4 py-2 rounded-full z-10 uppercase tracking-widest shadow-2xl">
                  {t('limitedTime')}
                </div>
              )}
              {selectedProduct.discount && (
                <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-full z-10 uppercase tracking-widest shadow-2xl">
                  -{selectedProduct.discount}% OFF
                </div>
              )}
            </div>
            
            <div className="p-4 space-y-4">
              <h1 className="text-xl font-bold">{selectedProduct.name}</h1>
              
              <div className="flex items-center gap-3">
                {selectedProduct.old_price && (
                  <span className="text-gray-500 line-through text-lg">{selectedProduct.old_price.toLocaleString()} دینار</span>
                )}
                <span className="text-3xl font-bold text-white">{selectedProduct.price.toLocaleString()} <span className="text-sm text-gray-400">دینار</span></span>
              </div>

              <div className="bg-[#1a1a1a] rounded-2xl p-4">
                <h3 className="font-bold mb-3 text-red-600">کێش هەڵبژێرە</h3>
                <div className="space-y-2">
                  {selectedProduct.weights.map((w: any, idx: number) => (
                    <button
                      key={idx}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 hover:border-red-600 transition-all"
                      onClick={() => {
                        addToCart(selectedProduct, idx, 1);
                        setSelectedProduct(null);
                      }}
                    >
                      <span>{w.w} {t('gram')}</span>
                      <span className="font-bold">{w.p.toLocaleString()} {t('dinar')}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
