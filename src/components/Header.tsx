import React from 'react';
import { Menu, Search, Star, ShoppingCart, X, Video, User } from 'lucide-react';

interface HeaderProps {
  language: string;
  setLanguage: (lang: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  cartCount: number;
  setShowCart: (show: boolean) => void;
  setShowSideMenu: (show: boolean) => void;
  isLoggedIn: boolean;
  currentUser: any;
  setCurrentView: (view: string) => void;
  averageRating: string;
  setShowReviews: (show: boolean) => void;
  appLogo: string;
  t: (key: string) => string;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  searchQuery,
  setSearchQuery,
  isSearching,
  setIsSearching,
  cartCount,
  setShowCart,
  setShowSideMenu,
  isLoggedIn,
  currentUser,
  setCurrentView,
  averageRating,
  setShowReviews,
  appLogo,
  t
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 h-14 flex items-center justify-between px-4" dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}>
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        {isSearching ? (
          <div className="flex-1 flex items-center gap-2">
            <button 
              onClick={() => { setIsSearching(false); setSearchQuery(''); }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <input 
              autoFocus
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSideMenu(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors lg:hidden"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center overflow-hidden">
                  {appLogo ? (
                    <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xs">چەرەزاتی شێردڵ</span>
                  )}
                </div>
                <span className="hidden md:block font-bold text-lg">چەرەزاتی شێردڵ</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentView('video_ai')}
                className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:flex"
                title={t('videoAiTitle')}
              >
                <Video size={24} />
              </button>
              <button 
                onClick={() => setIsSearching(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
              >
                <Search size={24} />
              </button>
              <button 
                onClick={() => setShowReviews(true)}
                className="flex items-center gap-1 p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <Star size={22} className="text-yellow-500" fill="currentColor" />
                <span className="text-xs font-bold text-yellow-500 pr-1">{averageRating}</span>
              </button>
              <button 
                onClick={() => setShowCart(true)}
                className={`p-2 hover:bg-white/10 rounded-full transition-colors relative ${cartCount > 0 ? 'cart-pulse' : ''}`}
              >
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setCurrentView(isLoggedIn ? 'profile' : 'login')}
                className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLoggedIn ? 'bg-red-600' : 'bg-white/10'}`}>
                  <User size={18} className="text-white" />
                </div>
                {isLoggedIn ? (
                  <span className="hidden lg:block text-xs font-bold max-w-[80px] truncate">
                    {currentUser?.full_name || currentUser?.username}
                  </span>
                ) : (
                  <span className="hidden lg:block text-xs font-bold uppercase tracking-wider">
                    {t('login')}
                  </span>
                )}
              </button>
              {!isLoggedIn && (
                <button 
                  onClick={() => setCurrentView('register')}
                  className="hidden lg:flex px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wider shadow-lg shadow-red-600/20"
                >
                  {t('register')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
