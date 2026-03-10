import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';

interface ReviewFormModalProps {
  showReviewForm: boolean;
  setShowReviewForm: (show: boolean) => void;
  newReview: any;
  setNewReview: (review: any) => void;
  handleSubmitReview: (e: React.FormEvent) => void;
  t: (key: string) => string;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  showReviewForm,
  setShowReviewForm,
  newReview,
  setNewReview,
  handleSubmitReview,
  t
}) => {
  return (
    <AnimatePresence>
      {showReviewForm && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReviewForm(false)}
            className="fixed inset-0 bg-black/80 z-[110] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#1a1a1a] z-[111] rounded-[32px] p-8 shadow-2xl border border-white/10"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">{t('addReview')}</h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star 
                      size={32} 
                      className={star <= newReview.rating ? 'text-yellow-500' : 'text-gray-600'} 
                      fill={star <= newReview.rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
              
              <div>
                <textarea
                  required
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder={t('addReview')}
                  className="w-full bg-[#262626] border border-white/10 rounded-2xl p-4 min-h-[120px] outline-none focus:ring-2 focus:ring-emerald-600 transition-all text-sm"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-colors"
                >
                  {t('back')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {t('send')}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
