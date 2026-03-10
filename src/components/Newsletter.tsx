import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, CheckCircle2 } from 'lucide-react';

interface NewsletterProps {
  t: (key: string) => string;
}

export const Newsletter: React.FC<NewsletterProps> = ({ t }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="mt-20 mb-10 px-4">
      <div className="bg-emerald-600 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-right">
          <div className="lg:max-w-md">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('newsletterTitle')}
            </h2>
            <p className="text-white/80 text-sm md:text-base">
              {t('newsletterSubtitle')}
            </p>
          </div>

          <div className="w-full max-w-md">
            {isSubscribed ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/20 backdrop-blur-md rounded-3xl p-6 flex flex-col items-center gap-3 text-white border border-white/20"
              >
                <CheckCircle2 size={48} />
                <p className="font-bold">{t('subscriptionSuccess')}</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pr-12 pl-4 text-white placeholder:text-white/60 outline-none focus:bg-white/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-white text-emerald-600 font-bold px-8 py-4 rounded-2xl hover:bg-gray-100 transition-colors shadow-xl"
                >
                  {t('subscribe')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
