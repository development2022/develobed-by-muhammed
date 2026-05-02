import React from 'react';
import { Home, ShoppingBag, ShoppingCart, User, Video } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  setShowCart: (show: boolean) => void;
  cartLength: number;
  isLoggedIn: boolean;
  t: (key: string) => string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  setCurrentView,
  setShowCart,
  cartLength,
  isLoggedIn,
  t
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 h-20 flex items-center justify-around px-4 lg:hidden">
      <button 
        onClick={() => setCurrentView('home')}
        className={`flex flex-col items-center gap-1 p-2 ${currentView === 'home' ? 'text-red-600' : 'text-gray-500'}`}
      >
        <Home size={24} />
        <span className="text-xs">{t('home')}</span>
      </button>
      <button 
        onClick={() => setCurrentView('video_ai')}
        className={`flex flex-col items-center gap-1 p-2 ${currentView === 'video_ai' ? 'text-red-600' : 'text-gray-500'}`}
      >
        <Video size={24} />
        <span className="text-xs">{t('videoAiTitle')}</span>
      </button>
      <button 
        onClick={() => setShowCart(true)}
        className="flex flex-col items-center gap-1 p-2 text-gray-500"
      >
        <ShoppingCart size={24} />
        <span className="text-xs">{t('cart')}</span>
      </button>
      <button 
        onClick={() => {
          if (isLoggedIn) {
            setCurrentView('profile');
          } else {
            setCurrentView('login');
          }
        }}
        className={`flex flex-col items-center gap-1 p-2 ${currentView === 'profile' || currentView === 'login' || currentView === 'register' ? 'text-red-600' : 'text-gray-500'}`}
      >
        <User size={24} />
        <span className="text-xs">{t('profile')}</span>
      </button>
    </nav>
  );
};
