import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, ShoppingCart, Info, User, Languages, X, Video } from 'lucide-react';

interface SideMenuProps {
  showSideMenu: boolean;
  setShowSideMenu: (show: boolean) => void;
  language: string;
  setLanguage: (lang: any) => void;
  setCurrentView: (view: string) => void;
  currentView: string;
  setShowCart: (show: boolean) => void;
  currentUser: any;
  appLogo: string;
  t: (key: string) => string;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  showSideMenu,
  setShowSideMenu,
  language,
  setLanguage,
  setCurrentView,
  currentView,
  setShowCart,
  currentUser,
  appLogo,
  t
}) => {
  return (
    <AnimatePresence>
      {showSideMenu && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSideMenu(false)}
            className="fixed inset-0 bg-black/60 z-[100]"
          />
          <motion.div 
            initial={{ x: language === 'en' || language === 'tr' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: language === 'en' || language === 'tr' ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${language === 'en' || language === 'tr' ? 'left-0' : 'right-0'} bottom-0 w-72 bg-[#1a1a1a] z-[101] shadow-2xl flex flex-col`}
            dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center overflow-hidden">
                  {appLogo ? <img src={appLogo} className="w-full h-full object-cover" /> : <span className="text-white font-bold">S</span>}
                </div>
                <span className="font-bold text-lg">چەرەزاتی شێردڵ</span>
              </div>
              <button onClick={() => setShowSideMenu(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              <button 
                onClick={() => { setCurrentView('home'); setShowSideMenu(false); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors text-gray-300"
              >
                <Home size={22} />
                <span className="font-medium">{t('home')}</span>
              </button>
              <button 
                onClick={() => { setCurrentView(currentUser ? 'profile' : 'login'); setShowSideMenu(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentView === 'login' || currentView === 'profile' ? 'bg-emerald-600 text-white' : 'hover:bg-white/5 text-gray-300'}`}
              >
                <User size={22} />
                <span className="font-medium">{currentUser ? t('profile') : t('login')}</span>
              </button>
              {!currentUser && (
                <button 
                  onClick={() => { setCurrentView('register'); setShowSideMenu(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentView === 'register' ? 'bg-emerald-600 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                >
                  <User size={22} className="text-emerald-600" />
                  <span className="font-medium">{t('register')}</span>
                </button>
              )}
              <button 
                onClick={() => { setShowCart(true); setShowSideMenu(false); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors text-gray-300"
              >
                <ShoppingCart size={22} />
                <span className="font-medium">{t('cart')}</span>
              </button>
              <button 
                onClick={() => { setCurrentView('video_ai'); setShowSideMenu(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentView === 'video_ai' ? 'bg-emerald-600 text-white' : 'hover:bg-white/5 text-gray-300'}`}
              >
                <Video size={22} />
                <span className="font-medium">{t('videoAiTitle')}</span>
              </button>
              <button 
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors text-gray-300"
              >
                <Info size={22} />
                <span className="font-medium">{t('about')}</span>
              </button>
              
              <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                {currentUser?.is_admin && (
                  <button 
                    onClick={() => { 
                      setCurrentView('admin'); 
                      setShowSideMenu(false); 
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentView === 'admin' ? 'bg-emerald-600 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                  >
                    <User size={22} />
                    <span className="font-medium">{t('admin')}</span>
                  </button>
                )}

                <div className="p-4 rounded-2xl bg-white/5 space-y-3">
                  <div className="flex items-center gap-3 text-gray-400 mb-1">
                    <Languages size={20} />
                    <span className="text-sm font-medium">{t('language')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'ku', label: 'Kurdî', flag: '☀️' },
                      { id: 'ar', label: 'العربية', flag: '🇮🇶' },
                      { id: 'en', label: 'English', flag: '🇺🇸' },
                      { id: 'tr', label: 'Türkçe', flag: '🇹🇷' }
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setLanguage(lang.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 ${language === lang.id ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 text-center space-y-1">
              <p className="text-xs text-gray-400 font-medium">sherdll development Muhammed aziz Rahman</p>
              <p className="text-[10px] text-gray-500">{t('version')} 1.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
