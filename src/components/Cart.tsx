import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';

interface CartProps {
  showCart: boolean;
  setShowCart: (show: boolean) => void;
  cart: any[];
  setCart: (cart: any[]) => void;
  updateQuantity: (cartId: number, quantity: number) => void;
  cartTotal: number;
  deliveryFee: number;
  discountAmount: number;
  finalTotal: number;
  handleCheckout: () => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  validatePromoCode: (code: string) => boolean;
  appliedPromo: { code: string, discount: number } | null;
  isFirstOrder: boolean;
  language: string;
  t: (key: string) => string;
}

export const Cart: React.FC<CartProps> = ({
  showCart,
  setShowCart,
  cart,
  setCart,
  updateQuantity,
  cartTotal,
  deliveryFee,
  discountAmount,
  finalTotal,
  handleCheckout,
  promoCode,
  setPromoCode,
  validatePromoCode,
  appliedPromo,
  isFirstOrder,
  language,
  t
}) => {
  return (
    <AnimatePresence>
      {showCart && (
        <motion.div 
          initial={{ x: language === 'en' || language === 'tr' ? '100%' : '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: language === 'en' || language === 'tr' ? '100%' : '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[60] bg-[#0f0f0f] flex flex-col"
          dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/10 rounded-full">
              {language === 'en' || language === 'tr' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </button>
            <h2 className="font-bold text-lg">{t('cart')}</h2>
            <button onClick={() => setCart([])} className="text-emerald-600 text-sm font-medium">{t('clear')}</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingCart size={64} />
                <p className="mt-4">{t('emptyCart')}</p>
              </div>
            ) : (
              <>
                {isFirstOrder && (
                  <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shrink-0">
                      <span className="font-bold text-xs">10%</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-600">{t('firstOrderDiscount')}</p>
                      <p className="text-xs text-gray-400">{t('launchOffer')}</p>
                    </div>
                  </div>
                )}
                
                {cart.map((item) => (
                  <div key={item.cartId} className="bg-[#1a1a1a] rounded-2xl p-4 flex gap-3">
                    <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{item.weights[item.selectedWeight].w} {t('gram')}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-600 font-bold">{item.finalPrice.toLocaleString()} {t('dinar')}</span>
                        <div className="flex items-center gap-2 bg-[#262626] rounded-lg px-2 py-1">
                          <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="text-emerald-600"><Minus size={16} /></button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="text-emerald-600"><Plus size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-bold">{t('promoCode')}</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. SHERDLL10"
                      className="flex-1 bg-[#262626] border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-600 transition-colors"
                    />
                    <button 
                      onClick={() => validatePromoCode(promoCode)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                      {t('apply')}
                    </button>
                  </div>
                  {appliedPromo && (
                    <div className="mt-3 flex items-center justify-between text-xs text-green-500 font-bold">
                      <span>{appliedPromo.code} ({appliedPromo.discount}%)</span>
                      <button onClick={() => validatePromoCode('')} className="text-gray-500 hover:text-emerald-600">✕</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-white/10 bg-[#1a1a1a] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('total')}</span>
                <span>{cartTotal.toLocaleString()} {t('dinar')}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-500 font-bold">
                  <span>{t('discount')}</span>
                  <span>-{discountAmount.toLocaleString()} {t('dinar')}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('delivery')}</span>
                <span className={deliveryFee === 0 ? 'text-green-500' : ''}>
                  {deliveryFee === 0 ? t('free') : deliveryFee.toLocaleString() + ' ' + t('dinar')}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                <span>{t('finalTotal')}</span>
                <span className="text-emerald-600">{finalTotal.toLocaleString()} {t('dinar')}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-emerald-600/20"
              >
                {t('checkout')}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
