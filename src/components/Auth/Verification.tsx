
import React from 'react';
import { Bell } from 'lucide-react';

interface VerificationProps {
  verificationEmail: string;
  setCurrentView: (val: any) => void;
  language: string;
}

export const Verification: React.FC<VerificationProps> = ({
  verificationEmail,
  setCurrentView,
  language
}) => {
  return (
    <div className="px-4 py-20 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-8">
        <Bell size={40} color="white" />
      </div>
      <h2 className="text-2xl font-bold mb-4">
        {language === 'en' ? 'Verify Your Email' : 'ئیمەیڵەکەت دڵنیا بکەرەوە'}
      </h2>
      <p className="text-gray-400 mb-8 max-w-sm">
        {language === 'en' 
          ? `We have sent you a verification email to ${verificationEmail}. Please verify it and log in.`
          : `ئیمەیڵێکی دڵنیاییمان ناردووە بۆ ${verificationEmail}. تکایە دڵنیای بکەرەوە و پاشان بچۆ ژوورەوە.`}
      </p>
      <button 
        onClick={() => setCurrentView('login')}
        className="w-full max-w-sm bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-red-600/20"
      >
        {language === 'en' ? 'Login' : 'چوونەژوورەوە'}
      </button>
    </div>
  );
};
