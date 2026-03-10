import React from 'react';
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  appLogo?: string;
  t: (key: string) => string;
}

export const Footer: React.FC<FooterProps> = ({ appLogo, t }) => {
  return (
    <footer className="bg-[#1a1a1a] border-t border-white/5 pt-16 pb-32 lg:pb-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl overflow-hidden flex items-center justify-center">
              {appLogo ? <img src={appLogo} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xl">S</span>}
            </div>
            <span className="font-bold text-xl">چەرەزاتی شێردڵ</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            باشترین و کوالێتی بەرزترین چەرەزات و شیرینی لای ئێمە دەست دەکەوێت. گەیاندنمان هەیە بۆ هەموو شوێنێک.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white transition-all">
              <Instagram size={20} />
            </a>
            <a href="#" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white transition-all">
              <Facebook size={20} />
            </a>
            <a href="#" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white transition-all">
              <Twitter size={20} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-bold text-lg mb-6">{t('quickLinks')}</h3>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-emerald-600 transition-colors">{t('home')}</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">{t('allProducts')}</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">{t('specialOffers')}</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">{t('about')}</a></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-bold text-lg mb-6">{t('categories')}</h3>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-emerald-600 transition-colors">چەرەزات</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">شیرینی</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">قاوە</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">دیاری</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-bold text-lg mb-6">{t('contactUs')}</h3>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-emerald-600" />
              <span>0750 123 4567</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-emerald-600" />
              <span>info@sherdll.com</span>
            </li>
            <li className="flex items-center gap-3">
              <MapPin size={18} className="text-emerald-600" />
              <span>هەولێر، شەقامی ٦٠ مەتری</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-xs text-center">
        <p>© {new Date().getFullYear()} Sherdll Nuts. All rights reserved.</p>
        <p>Developed with ❤️ by Muhammed Aziz Rahman</p>
      </div>
    </footer>
  );
};
