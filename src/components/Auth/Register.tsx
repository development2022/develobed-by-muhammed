
import React from 'react';
import { User, X } from 'lucide-react';

interface RegisterProps {
  registerData: { username: '', password: '', full_name: '', phone: '', address: '' };
  setRegisterData: (val: any) => void;
  handleRegister: (e: React.FormEvent) => void;
  setCurrentView: (val: any) => void;
  isLoading: boolean;
  t: (key: string) => string;
}

export const Register: React.FC<RegisterProps> = ({
  registerData,
  setRegisterData,
  handleRegister,
  setCurrentView,
  isLoading,
  t
}) => {
  return (
    <div className="px-4 py-20 flex flex-col items-center">
      <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mb-8">
        <User size={40} color="white" />
      </div>
      <h2 className="text-2xl font-bold mb-8">{t('register')}</h2>
      
      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">{t('fullName')}</label>
          <input 
            required
            type="text"
            value={registerData.full_name}
            onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
            placeholder="ناوی سیانی"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">ئیمەیڵ</label>
          <input 
            required
            type="email"
            value={registerData.username}
            onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
            placeholder="example@gmail.com"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">وشەی نهێنی</label>
          <input 
            required
            type="password"
            value={registerData.password}
            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
            placeholder="••••••••"
          />
        </div>
        
        <button 
          disabled={isLoading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
        >
          {isLoading ? '...' : t('register')}
        </button>
        
        <p className="text-center text-gray-400 text-sm pt-4">
          {t('haveAccount')} {' '}
          <button 
            type="button"
            onClick={() => setCurrentView('login')}
            className="text-emerald-600 font-bold hover:underline"
          >
            {t('login')}
          </button>
        </p>
      </form>
    </div>
  );
};
