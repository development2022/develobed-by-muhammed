
import React from 'react';
import { User, X } from 'lucide-react';

interface LoginProps {
  loginData: { username: '', password: '' };
  setLoginData: (val: any) => void;
  handleLogin: (e: React.FormEvent) => void;
  setCurrentView: (val: any) => void;
  handleGoogleSignIn: () => void;
  isLoading: boolean;
  t: (key: string) => string;
}

export const Login: React.FC<LoginProps> = ({
  loginData,
  setLoginData,
  handleLogin,
  setCurrentView,
  handleGoogleSignIn,
  isLoading,
  t
}) => {
  return (
    <div className="px-4 py-20 flex flex-col items-center">
      <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-8">
        <User size={40} color="white" />
      </div>
      <h2 className="text-2xl font-bold mb-8">{t('login')}</h2>
      
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">{t('username')} / Email</label>
          <input 
            required
            type="text"
            value={loginData.username}
            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-red-600 transition-all"
            placeholder={t('username')}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">وشەی نهێنی</label>
          <input 
            required
            type="password"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-red-600 transition-all"
            placeholder="••••••••"
          />
        </div>
        
        <button 
          disabled={isLoading}
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
        >
          {isLoading ? '...' : t('login')}
        </button>

        <div className="relative flex items-center justify-center py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative px-4 bg-[#0f0f0f] text-xs text-gray-500 uppercase">یان</span>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full bg-white text-black font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-3 hover:bg-gray-100"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5" alt="Google" />
          بەردەوامبە لەگەڵ Google
        </button>
        
        <p className="text-center text-gray-400 text-sm pt-4">
          {t('noAccount')} {' '}
          <button 
            type="button"
            onClick={() => setCurrentView('register')}
            className="text-red-600 font-bold hover:underline"
          >
            {t('register')}
          </button>
        </p>
      </form>
    </div>
  );
};
