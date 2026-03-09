import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, MessageSquare } from 'lucide-react';

interface ReviewsModalProps {
  showReviews: boolean;
  setShowReviews: (show: boolean) => void;
  reviews: any[];
  averageRating: string;
  language: string;
  t: (key: string) => string;
}

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  showReviews,
  setShowReviews,
  reviews,
  averageRating,
  language,
  t
}) => {
  return (
    <AnimatePresence>
      {showReviews && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReviews(false)}
            className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] z-[101] rounded-t-[32px] max-h-[80vh] overflow-hidden flex flex-col"
            dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {t('reviews')}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-black text-white">{averageRating}</span>
                  <div className="flex flex-col">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={i < Math.round(Number(averageRating)) ? 'text-yellow-500' : 'text-gray-700'} 
                          fill={i < Math.round(Number(averageRating)) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-500">لە کۆی ٥.٠</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowReviews(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                  <p>{t('noReviews')}</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="bg-white/5 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            className={i < review.rating ? 'text-yellow-500' : 'text-gray-600'} 
                            fill={i < review.rating ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {new Date(review.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'tr' ? 'tr-TR' : 'ar-IQ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
