/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Heart, Bell, ChevronLeft, ChevronRight, 
  ShoppingBag,
  Plus, Minus, ShoppingCart, Trash2, MapPin, 
  Edit3, Gift, Clock, Check, Grid, Home, User, Menu, X, Camera, Info, Star, MessageSquare, Languages
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

import { Category, Promotion, Product, CartItem, User as UserType, Review } from './types';
import { translations, Language } from './translations';
import { Toast } from './components/Toast';
import { PromoSlider } from './components/PromoSlider';
import { Header } from './components/Header';
import { SideMenu } from './components/SideMenu';
import { Cart } from './components/Cart';
import { ProductCard } from './components/ProductCard';
import { CategorySidebar } from './components/CategorySidebar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ReviewsModal } from './components/ReviewsModal';
import { ReviewFormModal } from './components/ReviewFormModal';
import { BottomNav } from './components/BottomNav';
import { MobileCategoriesGrid } from './components/MobileCategoriesGrid';
import { SpecialOffers } from './components/SpecialOffers';
import { LiveSupport } from './components/LiveSupport';
import { FeaturedCategories } from './components/FeaturedCategories';
import { Newsletter } from './components/Newsletter';
import { BackToTop } from './components/BackToTop';
import { Footer } from './components/Footer';
import { WelcomeLoader } from './components/WelcomeLoader';
import { ScrollProgress } from './components/ScrollProgress';
import { VideoAI } from './components/VideoAI';
import { TopBanner } from './components/TopBanner';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Verification } from './components/Auth/Verification';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function translateText(text: string): Promise<{ ar: string, en: string, tr: string }> {
  if (!text) return { ar: '', en: '', tr: '' };
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following Kurdish text into Arabic, English, and Turkish. Return ONLY a JSON object with keys "ar", "en", and "tr". Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ar: { type: Type.STRING },
            en: { type: Type.STRING },
            tr: { type: Type.STRING },
          },
          required: ["ar", "en", "tr"],
        },
      },
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Translation error:", error);
    return { ar: text, en: text, tr: text }; // Fallback to original text
  }
}

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastOrder, setLastOrder] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });
  const [currentView, setCurrentView] = useState<'home' | 'admin' | 'login' | 'profile' | 'register' | 'admin_login' | 'video_ai'>('home');
  const [adminTab, setAdminTab] = useState<'items' | 'manage_cats' | 'new_cat' | 'settings' | 'promotions' | 'delivery' | 'orders'>('items');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [registerData, setRegisterData] = useState({ username: '', password: '', full_name: '', phone: '', address: '' });
  const [regStep, setRegStep] = useState<'details'>('details');
  const [verificationCode, setVerificationCode] = useState('');
  const [debugCode, setDebugCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [verificationEmail, setVerificationEmail] = useState('');
  const [appLogo, setAppLogo] = useState('');
  const [deliveryFeeVal, setDeliveryFeeVal] = useState(5000);
  const [freeThreshold, setFreeThreshold] = useState(58000);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string, discount: number } | null>(null);
  const [userOrdersCount, setUserOrdersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  const [showReviews, setShowReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [language, setLanguage] = useState<Language>('ku');

  useEffect(() => {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setIsLoggedIn(true);
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!user.emailVerified) {
          setVerificationEmail(user.email || '');
          await signOut(auth);
          setCurrentView('verification');
          return;
        }
        const firebaseUser: UserType = {
          id: 0,
          username: user.email || '',
          full_name: user.displayName || user.email?.split('@')[0] || '',
          phone: '',
          address: '',
          role: 'user',
          is_admin: 0
        };
        setIsLoggedIn(true);
        setCurrentUser(firebaseUser);
        localStorage.setItem('currentUser', JSON.stringify(firebaseUser));
      } else {
        // Only clear if we were logged in via Firebase
        // We can check if the current user is a firebase user (id: 0)
        setCurrentUser(prev => {
          if (prev && prev.id === 0) {
            setIsLoggedIn(false);
            localStorage.removeItem('currentUser');
            return null;
          }
          return prev;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentView === 'admin' && (!isLoggedIn || !currentUser?.is_admin)) {
      setCurrentView('home');
    }
  }, [currentView, isLoggedIn, currentUser]);

  const getName = useCallback((obj: any) => {
    if (!obj) return '';
    if (language === 'ar' && obj.name_ar) return obj.name_ar;
    if (language === 'en' && obj.name_en) return obj.name_en;
    if (language === 'tr' && obj.name_tr) return obj.name_tr;
    if (language === 'ar' && obj.title_ar) return obj.title_ar;
    if (language === 'en' && obj.title_en) return obj.title_en;
    if (language === 'tr' && obj.title_tr) return obj.title_tr;
    return obj.name || obj.title || '';
  }, [language]);


  const averageRating = useMemo(() => {
    if (reviews.length === 0) return "0.0";
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const t = useCallback((key: string) => {
    return (translations[language] as any)[key] || key;
  }, [language]);

  // Admin Form State
  const [newProduct, setNewProduct] = useState({
    category_id: '',
    name: '',
    price: 0,
    old_price: '',
    discount: '',
    image: '',
    weights: [{ w: 250, p: 0 }],
    is_limited: 0
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Auto-calculate discount or price
  useEffect(() => {
    if (adminTab === 'items') {
      const price = Number(newProduct.price);
      const oldPrice = Number(newProduct.old_price);

      if (oldPrice > 0 && price > 0 && !newProduct.discount) {
        const calculatedDiscount = Math.round(((oldPrice - price) / oldPrice) * 100);
        if (calculatedDiscount > 0) {
          setNewProduct(prev => ({ ...prev, discount: calculatedDiscount.toString() }));
        }
      }
    }
  }, [newProduct.price, newProduct.old_price, adminTab]);

  const [newCategory, setNewCategory] = useState({
    id: '',
    name: '',
    icon: ''
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) {
          // Removed auto-selection to show category grid as landing page on home
          setNewProduct(prev => {
            if (!prev.category_id || !data.find((c: any) => c.id === prev.category_id)) {
              return { ...prev, category_id: data[0].id };
            }
            return prev;
          });
        } else {
          setSelectedCategory('');
        }
      });
  };

  useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const fetchPromotions = () => {
    fetch('/api/promotions')
      .then(res => res.json())
      .then(setPromotions);
  };

  const fetchReviews = () => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(setReviews);
  };

  const fetchOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(setOrders);
  };

  const updateOrderStatus = async (id: number, status: string) => {
    const response = await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (response.ok) {
      fetchOrders();
      showToastMsg('Order status updated');
    }
  };

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.logo) setAppLogo(data.logo);
        if (data.delivery_fee) setDeliveryFeeVal(parseInt(data.delivery_fee));
        if (data.free_delivery_threshold) setFreeThreshold(parseInt(data.free_delivery_threshold));
      });
  };

  const fetchProducts = (all = false) => {
    const url = all ? '/api/products' : `/api/products?category=${selectedCategory}`;
    fetch(url)
      .then(res => res.json())
      .then(setProducts);
  };

  useEffect(() => {
    fetchCategories();
    fetchPromotions();
    fetchSettings();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (currentView === 'home' && !isSearching) {
      fetchProducts();
    }
  }, [selectedCategory, isSearching, currentView]);

  useEffect(() => {
    if (isSearching || (currentView === 'admin' && (adminTab === 'manage_products' || adminTab === 'items'))) {
      fetchProducts(true);
    }
  }, [isSearching, currentView, adminTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Try Database Login first (for admin and traditional users)
      const dbResponse = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });

      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        if (dbData.success) {
          setIsLoggedIn(true);
          setCurrentUser(dbData.user);
          localStorage.setItem('currentUser', JSON.stringify(dbData.user));
          setCurrentView('home');
          showToastMsg(`بەخێربێیتەوە ${dbData.user.full_name || dbData.user.username}`);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback to Firebase Auth (if it looks like an email)
      if (loginData.username.includes('@')) {
        const userCredential = await signInWithEmailAndPassword(auth, loginData.username, loginData.password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
          setVerificationEmail(user.email || '');
          await signOut(auth);
          setCurrentView('verification');
          setIsLoading(false);
          return;
        }

        setIsLoggedIn(true);
        setCurrentUser({
          id: 0,
          username: user.email || '',
          full_name: user.displayName || user.email?.split('@')[0] || '',
          phone: '',
          address: '',
          role: 'user',
          is_admin: 0
        });
        setCurrentView('home');
        showToastMsg(`بەخێربێیتەوە ${user.displayName || user.email}`);
      } else {
        showToastMsg("Email or password is incorrect");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorCode = error.code;
      const errorMessage = error.message || '';
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        showToastMsg("Email or password is incorrect");
      } else {
        showToastMsg(errorMessage || "Email or password is incorrect");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/register/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: registerData.phone })
      });
      const data = await response.json();
      if (response.ok) {
        setRegStep('code');
        setDebugCode(data.debug_code);
        setResendTimer(60);
        showToastMsg(language === 'en' ? 'Verification code sent' : 'کۆدی دڵنیایی نێردرا');
      } else {
        showToastMsg(data.error || (language === 'en' ? 'An error occurred' : 'هەڵەیەک ڕوویدا'));
      }
    } catch (err) {
      showToastMsg(language === 'en' ? 'Connection error' : 'هەڵەی پەیوەندی');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/register/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: registerData.phone, code: verificationCode })
      });
      if (response.ok) {
        setRegStep('details');
        showToastMsg(language === 'en' ? 'Phone verified successfully' : 'ژمارەکەت دڵنیاکرایەوە');
      } else {
        const data = await response.json();
        showToastMsg(data.error || (language === 'en' ? 'Invalid code' : 'کۆدەکە هەڵەیە'));
      }
    } catch (err) {
      showToastMsg(language === 'en' ? 'Connection error' : 'هەڵەی پەیوەندی');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerData.username, registerData.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: registerData.full_name });
      
      await sendEmailVerification(user);
      setVerificationEmail(user.email || '');
      await signOut(auth);
      setCurrentView('verification');
      showToastMsg(language === 'en' ? 'Verification email sent' : 'ئیمەیڵی دڵنیایی نێردرا');
    } catch (error: any) {
      console.error("Register error:", error);
      const errorCode = error.code;
      const errorMessage = error.message || '';
      if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('auth/email-already-in-use')) {
        showToastMsg("User already exists. Please sign in");
      } else if (errorCode === 'auth/weak-password' || errorMessage.includes('auth/weak-password')) {
        showToastMsg("Password should be at least 6 characters");
      } else {
        showToastMsg(errorMessage || 'هەڵەیەک ڕوویدا لە کاتی خۆتۆمارکردن');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setIsLoggedIn(true);
      setCurrentUser({
        id: 0,
        username: user.email || '',
        full_name: user.displayName || user.email?.split('@')[0] || '',
        phone: '',
        address: '',
        role: 'user',
        is_admin: 0
      });
      setCurrentView('home');
      showToastMsg(`بەخێربێیت ${user.displayName || user.email}`);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      showToastMsg(language === 'en' ? "Google sign-in failed" : "چوونەژوورەوە بە گووگڵ سەرکەوتوو نەبوو");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'category' | 'edit_category' | 'logo' | 'edit_promo' | 'edit_product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (target === 'product') {
        setNewProduct({ ...newProduct, image: data.url });
      } else if (target === 'edit_product' && editingProduct) {
        setEditingProduct({ ...editingProduct, image: data.url });
      } else if (target === 'category') {
        setNewCategory({ ...newCategory, icon: data.url });
      } else if (target === 'edit_category' && editingCategory) {
        setEditingCategory({ ...editingCategory, icon: data.url });
      } else if (target === 'edit_promo' && editingPromotion) {
        setEditingPromotion({ ...editingPromotion, image: data.url });
      } else if (target === 'logo') {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'logo', value: data.url })
        });
        setAppLogo(data.url);
      }
      showToastMsg(t('uploadSuccess'));
    } catch (error) {
      showToastMsg(t('uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleUpdatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotion) return;

    let translated = { ar: editingPromotion.title_ar || '', en: editingPromotion.title_en || '', tr: editingPromotion.title_tr || '' };
    try {
      showToastMsg('خەریکی وەرگێڕانە...');
      translated = await translateText(editingPromotion.title);
    } catch (error) {
      console.error("Translation error:", error);
    }

    const response = await fetch(`/api/promotions/${editingPromotion.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editingPromotion,
        title_ar: translated.ar,
        title_en: translated.en,
        title_tr: translated.tr
      })
    });

    if (response.ok) {
      showToastMsg(t('promoUpdateSuccess'));
      setEditingPromotion(null);
      fetchPromotions();
    } else {
      showToastMsg(t('errorOccurred'));
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.icon) {
      showToastMsg(t('selectImage'));
      return;
    }

    let translated = { ar: '', en: '', tr: '' };
    try {
      showToastMsg('خەریکی وەرگێڕانە...');
      translated = await translateText(newCategory.name);
    } catch (error) {
      console.error("Translation error:", error);
    }

    const id = Date.now().toString();
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...newCategory, 
        id,
        name_ar: translated.ar,
        name_en: translated.en,
        name_tr: translated.tr
      })
    });

    if (response.ok) {
      showToastMsg(t('addCategorySuccess'));
      setAdminTab('manage_cats');
      fetchCategories();
      setNewCategory({ id: '', name: '', icon: '' });
    } else {
      showToastMsg('هەڵەیەک ڕوویدا');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    let translated = { ar: editingCategory.name_ar || '', en: editingCategory.name_en || '', tr: editingCategory.name_tr || '' };
    try {
      showToastMsg('خەریکی وەرگێڕانە...');
      translated = await translateText(editingCategory.name);
    } catch (error) {
      console.error("Translation error:", error);
    }

    const response = await fetch(`/api/categories/${editingCategory.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editingCategory,
        name_ar: translated.ar,
        name_en: translated.en,
        name_tr: translated.tr
      })
    });

    if (response.ok) {
      showToastMsg(t('categoryUpdateSuccess'));
      setEditingCategory(null);
      fetchCategories();
    } else {
      showToastMsg(t('errorOccurred'));
    }
  };

  const handleSaveDeliverySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'delivery_fee', value: deliveryFeeVal.toString() })
      });
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'free_delivery_threshold', value: freeThreshold.toString() })
      });
      showToastMsg(t('deliverySettingsSaved'));
    } catch (error) {
      showToastMsg(t('errorOccurred'));
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm(t('categoryDeleteConfirm'))) return;

    console.log("Deleting category:", id);
    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log("Category deleted successfully");
        showToastMsg(t('categoryDeleteSuccess'));
        fetchCategories();
        fetchProducts(currentView === 'admin');
      } else {
        const errData = await response.json();
        console.error("Category delete failed:", errData);
        showToastMsg(t('categoryDeleteError'));
      }
    } catch (error) {
      console.error("Category delete error:", error);
      showToastMsg(t('errorOccurred'));
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.image) {
      showToastMsg('تکایە وێنەیەک هەڵبژێرە');
      return;
    }

    let translated = { ar: '', en: '', tr: '' };
    try {
      showToastMsg('خەریکی وەرگێڕانە...');
      translated = await translateText(newProduct.name);
    } catch (error) {
      console.error("Translation error:", error);
    }

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newProduct,
        name_ar: translated.ar,
        name_en: translated.en,
        name_tr: translated.tr,
        price: Number(newProduct.price),
        old_price: newProduct.old_price ? Number(newProduct.old_price) : null,
        discount: newProduct.discount ? Number(newProduct.discount) : null,
      })
    });

    if (response.ok) {
      showToastMsg(t('productAddSuccess'));
      setAdminTab('manage_products');
      fetchProducts(true);
      setNewProduct({
        category_id: categories.length > 0 ? categories[0].id : '',
        name: '',
        price: 0,
        old_price: '',
        discount: '',
        image: '',
        weights: [{ w: 250, p: 0 }]
      });
    } else {
      showToastMsg(t('productAddError'));
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let translated = { ar: editingProduct.name_ar || '', en: editingProduct.name_en || '', tr: editingProduct.name_tr || '' };
    try {
      showToastMsg('خەریکی وەرگێڕانە...');
      translated = await translateText(editingProduct.name);
    } catch (error) {
      console.error("Translation error:", error);
    }

    const response = await fetch(`/api/products/${editingProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editingProduct,
        name_ar: translated.ar,
        name_en: translated.en,
        name_tr: translated.tr
      })
    });

    if (response.ok) {
      showToastMsg(t('productUpdateSuccess'));
      setEditingProduct(null);
      fetchProducts(true);
    } else {
      showToastMsg(t('errorOccurred'));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm(t('deleteProductConfirm'))) return;

    console.log("Deleting product:", id);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log("Product deleted successfully");
        showToastMsg(t('productDeleteSuccess'));
        fetchProducts(currentView === 'admin' || isSearching);
      } else {
        const errData = await response.json();
        console.error("Product delete failed:", errData);
        showToastMsg(t('errorOccurred'));
      }
    } catch (error) {
      console.error("Product delete error:", error);
      showToastMsg(t('errorOccurred'));
    }
  };

  const showToastMsg = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  const addToCart = (product: Product, selectedWeight: number, quantity: number) => {
    const unitPrice = product.weights[selectedWeight].p;
    const cartItem: CartItem = {
      ...product,
      cartId: Date.now() + Math.random(),
      selectedWeight,
      quantity,
      finalPrice: unitPrice * quantity
    };
    setCart(prev => [...prev, cartItem]);
    showToastMsg(t('addedToCart'));
  };

  const handleCheckout = () => {
    if (!isLoggedIn || !currentUser) {
      showToastMsg(t('mustLoginOrder'));
      setCurrentView('login');
      setShowCart(false);
      return;
    }

    const whatsappNumber = "9647504394038";
    
    const sendOrder = async (locationUrl?: string) => {
      // Save to DB first
      try {
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            items: cart.map(item => ({
              id: item.id,
              name: item.name,
              weight: item.weights[item.selectedWeight].w,
              quantity: item.quantity,
              price: item.finalPrice
            })),
            total_price: finalTotal,
            delivery_fee: deliveryFee,
            discount_applied: discountAmount,
            promo_code: appliedPromo?.code || null,
            location_url: locationUrl
          })
        });
        
        if (!orderResponse.ok) {
          throw new Error('Failed to save order');
        }

        const orderData = await orderResponse.json();
        const orderId = orderData.orderId;

        let message = `🛒 *${t('newOrder')} (#${orderId})*\n\n`;
        
        message += `👤 *${t('fullName')}*: ${currentUser.full_name}\n`;
        message += `📞 *${t('phone')}*: ${currentUser.phone}\n`;
        message += `🏠 *${t('address')}*: ${currentUser.address}\n\n`;

        cart.forEach((item, index) => {
          message += `${index + 1}. *${item.name}*\n`;
          message += `   ⚖️ ${t('weight')}: ${item.weights[item.selectedWeight].w} ${t('gram')}\n`;
          message += `   🔢 ${t('quantity')}: ${item.quantity}\n`;
          message += `   💰 ${t('price')}: ${item.finalPrice.toLocaleString()} ${t('dinar')}\n\n`;
        });

        message += "--------------------------\n";
        message += `💵 ${t('total')}: ${cartTotal.toLocaleString()} ${t('dinar')}\n`;
        if (discountAmount > 0) {
          message += `🎁 ${t('discount')}: -${discountAmount.toLocaleString()} ${t('dinar')}\n`;
        }
        message += `🚚 ${t('delivery')}: ${deliveryFee === 0 ? t('free') : deliveryFee.toLocaleString() + ' ' + t('dinar')}\n`;
        message += `✨ *${t('finalTotal')}: ${finalTotal.toLocaleString()} ${t('dinar')}*\n`;

        if (locationUrl) {
          message += `\n📍 *${t('location')}*:\n${locationUrl}`;
        }

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        
        setLastOrder([...cart]);
        setShowCart(false);
        setShowCheckoutSuccess(true);
        setCart([]);
        setAppliedPromo(null);
        fetchOrders();
      } catch (error) {
        console.error("Checkout error:", error);
        showToastMsg(t('errorOccurred'));
      }
    };

    if ("geolocation" in navigator) {
      showToastMsg("Getting location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          sendOrder(locationUrl);
        },
        (error) => {
          console.error("Error getting location:", error);
          showToastMsg("Could not get location. Sending without it.");
          sendOrder();
        },
        { timeout: 10000 }
      );
    } else {
      sendOrder();
    }
  };
  
  const validatePromoCode = (code: string) => {
    const validCodes: Record<string, number> = {
      'SHERDLL10': 10,
      'LAUNCH20': 20,
      'NUTS5': 5
    };

    const upperCode = code.toUpperCase().trim();
    if (validCodes[upperCode]) {
      setAppliedPromo({ code: upperCode, discount: validCodes[upperCode] });
      showToastMsg(t('promoApplied'));
      return true;
    } else {
      showToastMsg(t('invalidPromo'));
      return false;
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.comment.trim()) return;

    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview)
    });

    if (response.ok) {
      showToastMsg('سوپاس بۆ هەڵسەنگاندنەکەت!');
      setShowReviewForm(false);
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
    }
  };

  const updateQuantity = (cartId: number, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(item => item.cartId !== cartId));
    } else {
      setCart(prev => prev.map(item => {
        if (item.cartId === cartId) {
          const unitPrice = item.weights[item.selectedWeight].p;
          return { ...item, quantity: newQty, finalPrice: unitPrice * newQty };
        }
        return item;
      }));
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.finalPrice, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    let totalDiscount = 0;
    
    // First order discount (10%)
    if (isLoggedIn && userOrdersCount === 0 && cart.length > 0) {
      totalDiscount += cartTotal * 0.1;
    }
    
    // Promo code discount
    if (appliedPromo) {
      totalDiscount += cartTotal * (appliedPromo.discount / 100);
    }
    
    return Math.floor(totalDiscount);
  }, [cartTotal, isLoggedIn, userOrdersCount, appliedPromo, cart.length]);

  const deliveryFee = useMemo(() => {
    if (cartTotal === 0) return 0;
    return cartTotal >= freeThreshold ? 0 : deliveryFeeVal;
  }, [cartTotal, freeThreshold, deliveryFeeVal]);

  const finalTotal = useMemo(() => {
    return Math.max(0, cartTotal - discountAmount + deliveryFee);
  }, [cartTotal, discountAmount, deliveryFee]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      <TopBanner t={t} />
      <ScrollProgress />
      <AnimatePresence>
        {isLoading && <WelcomeLoader appLogo={appLogo} />}
      </AnimatePresence>

      {/* Header */}
      <Header 
        language={language}
        setLanguage={setLanguage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        setIsSearching={setIsSearching}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        setShowCart={setShowCart}
        setShowSideMenu={setShowSideMenu}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        setCurrentView={setCurrentView}
        averageRating={averageRating}
        setShowReviews={setShowReviews}
        appLogo={appLogo}
        t={t}
      />

      {/* Side Menu Drawer */}
      <SideMenu 
        showSideMenu={showSideMenu}
        setShowSideMenu={setShowSideMenu}
        language={language}
        setLanguage={setLanguage}
        setCurrentView={setCurrentView}
        currentView={currentView}
        setShowCart={setShowCart}
        currentUser={currentUser}
        appLogo={appLogo}
        t={t}
      />

      <main className="pt-14 w-full max-w-7xl mx-auto" dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}>
        {currentView === 'home' ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <CategorySidebar 
              isSearching={isSearching}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              getName={getName}
              t={t}
            />

            <div className="flex-1 min-w-0">
              {!isSearching && !selectedCategory && (
                <>
                  <div className="md:mt-4">
                    <PromoSlider promotions={promotions} getName={getName} />
                  </div>

                  {/* Featured Categories (Desktop Only) */}
                  <div className="px-4 mt-10">
                    <FeaturedCategories 
                      categories={categories}
                      setSelectedCategory={setSelectedCategory}
                      getName={getName}
                      t={t}
                    />
                  </div>
                  
                  {/* Mobile Categories Grid (Hidden on Desktop Sidebar) */}
                  <MobileCategoriesGrid 
                    categories={categories}
                    setSelectedCategory={setSelectedCategory}
                    getName={getName}
                    t={t}
                  />

                  {/* Special Offers Section */}
                  <SpecialOffers 
                    products={products}
                    setSelectedProduct={setSelectedProduct}
                    getName={getName}
                    language={language}
                    t={t}
                  />

                  {/* Limited Time Offers (New) */}
                  <div className="px-4 mt-12 mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase">{t('limitedTimeOffers')}</h2>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{t('limitedTime')}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-red-600/10 px-3 py-1.5 rounded-full border border-red-600/20">
                        <Clock size={14} className="text-red-600 animate-pulse" />
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Ends in: 02:45:12</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {products.filter(p => p.is_limited).slice(0, 4).map(product => (
                        <ProductCard 
                          key={product.id}
                          product={product}
                          setSelectedProduct={setSelectedProduct}
                          addToCart={addToCart}
                          getName={getName}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

            {isSearching && (
              <div className="px-4 mt-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Search size={20} className="text-red-600" />
                  {t('searchResult')}
                </h2>
                {searchQuery && filteredProducts.length === 0 && (
                  <p className="text-gray-500 mt-4 text-center">{t('noProductsFound')} "{searchQuery}"</p>
                )}
              </div>
            )}

              {/* Products List */}
              {(isSearching || selectedCategory || (!isSearching && !selectedCategory)) && (
                <div className="px-4 py-4">
                  {(isSearching || selectedCategory) && (
                    <div className="flex items-center gap-3 mb-6">
                      {selectedCategory && !isSearching && (
                        <button 
                          onClick={() => setSelectedCategory('')}
                          className="p-2 bg-[#1a1a1a] rounded-full text-red-600 hover:bg-[#262626] transition-colors lg:hidden"
                        >
                          {language === 'en' || language === 'tr' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
                        </button>
                      )}
                      <h2 className="text-xl font-bold">
                        {isSearching ? t('searchResult') : getName(categories.find(c => c.id === selectedCategory))}
                      </h2>
                      <div className="flex-1" />
                      <span className="text-sm text-gray-400">{filteredProducts.length} {t('itemsCount')}</span>
                    </div>
                  )}

                  {!isSearching && !selectedCategory && (
                    <div className="px-0 mt-8 mb-4">
                      <h2 className="text-xl font-bold">{t('allProducts')}</h2>
                    </div>
                  )}
                  
                  {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <Grid size={48} className="opacity-20 mb-4" />
                      <p>{t('noProductsInCategory')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredProducts.map(product => (
                        <ProductCard 
                          key={product.id}
                          product={product}
                          setSelectedProduct={setSelectedProduct}
                          addToCart={addToCart}
                          getName={getName}
                          t={t}
                        />
                      ))}
                  </div>
                )}

                {!isSearching && !selectedCategory && (
                  <Newsletter t={t} />
                )}
              </div>
            )}
            </div>
          </div>
        ) : currentView === 'verification' ? (
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
        ) : currentView === 'login' ? (
          <div className="px-4 py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-8">
              <User size={40} color="white" />
            </div>
            <h2 className="text-2xl font-bold mb-8">{language === 'en' ? 'User Login' : language === 'tr' ? 'Kullanıcı Girişi' : 'چوونەژوورەوەی بەکارهێنەر'}</h2>
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-white/5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{language === 'en' ? 'Email' : language === 'tr' ? 'E-posta' : 'ئیمەیڵ'}</label>
                <input 
                  type="email"
                  required
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{language === 'en' ? 'Password' : language === 'tr' ? 'Şifre' : 'وشەی نهێنی'}</label>
                <input 
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                  placeholder="..."
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors mt-4 shadow-lg shadow-red-600/20"
              >
                {language === 'en' ? 'Login' : language === 'tr' ? 'Giriş Yap' : 'چوونەژوورەوە'}
              </button>

              <div className="relative flex items-center justify-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-sm">{language === 'en' ? 'OR' : 'یان'}</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-3 shadow-lg"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                {language === 'en' ? 'Continue with Google' : 'بەردەوامبە لەگەڵ گووگڵ'}
              </button>
              <div className="text-center pt-4 space-y-4">
                <p className="text-sm text-gray-500">{t('noAccount')} <button type="button" onClick={() => setCurrentView('register')} className="text-red-600 font-bold hover:underline">{t('register')}</button></p>
              </div>
            </form>
          </div>
        ) : currentView === 'admin_login' ? (
          <div className="px-4 py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-8">
              <Grid size={40} color="white" />
            </div>
            <h2 className="text-2xl font-bold mb-8">{t('adminLogin')}</h2>
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-white/5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Admin Email</label>
                <input 
                  type="text"
                  required
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Admin Password</label>
                <input 
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-2xl transition-colors mt-4"
              >
                Login as Admin
              </button>
              <button 
                type="button"
                onClick={() => setCurrentView('login')}
                className="w-full text-sm text-gray-500 mt-4"
              >
                {t('back')}
              </button>
            </form>
          </div>
        ) : currentView === 'register' ? (
          <div className="px-4 py-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6">
              <User size={40} color="white" />
            </div>
            <h2 className="text-2xl font-bold mb-6">{t('register')}</h2>
            
            <div className="w-full max-w-sm bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">{t('fullName')}</label>
                  <input 
                    type="text"
                    required
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                    className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">{language === 'en' ? 'Email' : language === 'tr' ? 'E-posta' : 'ئیمەیڵ'}</label>
                  <input 
                    type="email"
                    required
                    value={registerData.username}
                    onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                    className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">{language === 'en' ? 'Password' : language === 'tr' ? 'Şifre' : 'وشەی نهێنی'}</label>
                  <input 
                    type="password"
                    required
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="..."
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors mt-4 shadow-lg shadow-red-600/20"
                >
                  {t('register')}
                </button>

                <div className="relative flex items-center justify-center py-2">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-gray-500 text-sm">{language === 'en' ? 'OR' : 'یان'}</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-3 shadow-lg"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  {language === 'en' ? 'Continue with Google' : 'بەردەوامبە لەگەڵ گووگڵ'}
                </button>
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">{t('haveAccount')} <button type="button" onClick={() => setCurrentView('login')} className="text-red-600 font-bold hover:underline">{language === 'en' ? 'Login' : 'چوونەژوورەوە'}</button></p>
                </div>
              </form>
            </div>
          </div>
        ) : currentView === 'profile' ? (
          <div className="px-4 py-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-600/20">
              <User size={48} color="white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{currentUser?.full_name || currentUser?.username}</h2>
            <p className="text-gray-500 mb-8">@{currentUser?.username}</p>
            
            <div className="w-full max-w-sm space-y-4">
              <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('fullName')}</p>
                    <p className="font-medium">{currentUser?.full_name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('address')}</p>
                    <p className="font-medium">{currentUser?.address || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('phone')}</p>
                    <p className="font-medium">{currentUser?.phone || '-'}</p>
                  </div>
                </div>
              </div>

              {currentUser?.is_admin && (
                <button 
                  onClick={() => setCurrentView('admin')}
                  className="w-full bg-[#1a1a1a] hover:bg-white/5 text-white font-bold py-4 rounded-2xl transition-colors border border-white/5 flex items-center justify-center gap-3"
                >
                  <Grid size={20} className="text-red-600" />
                  {t('admin')}
                </button>
              )}

              <button 
                onClick={() => {
                  signOut(auth);
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                  localStorage.removeItem('currentUser');
                  setCurrentView('login');
                  showToastMsg('بە سەرکەوتوویی چوویتە دەرەوە');
                }}
                className="w-full bg-white/5 hover:bg-red-600/10 text-red-600 font-bold py-4 rounded-2xl transition-colors border border-red-600/20"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        ) : (currentView === 'admin' && currentUser?.is_admin) ? (
          <div className="px-4 py-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Admin Sidebar for Desktop */}
              <div className="hidden lg:block w-64 flex-shrink-0 space-y-2">
                <div className="bg-[#1a1a1a] p-6 rounded-3xl mb-6">
                  <h2 className="text-xl font-bold text-red-600 mb-1">{t('welcomeAdmin')}</h2>
                  <p className="text-sm text-gray-500">{currentUser?.full_name}</p>
                </div>
                
                {[
                  { id: 'items', label: t('addProduct'), icon: <Plus size={20} /> },
                  { id: 'manage_products', label: t('manageProducts'), icon: <Grid size={20} /> },
                  { id: 'manage_cats', label: t('manageCategories'), icon: <Grid size={20} /> },
                  { id: 'new_cat', label: t('newCategory'), icon: <Plus size={20} /> },
                  { id: 'promotions', label: t('promotions'), icon: <Gift size={20} /> },
                  { id: 'delivery', label: t('deliverySettings'), icon: <MapPin size={20} /> },
                  { id: 'orders', label: t('orders'), icon: <ShoppingBag size={20} /> },
                  { id: 'settings', label: t('settings'), icon: <Grid size={20} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setAdminTab(tab.id as any);
                      if (tab.id === 'manage_products') fetchProducts(true);
                      if (tab.id === 'orders') fetchOrders();
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${adminTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#262626]'}`}
                  >
                    {tab.icon}
                    <span className="font-bold text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Admin Header */}
              <div className="lg:hidden">
                <div className="bg-[#1a1a1a] p-6 rounded-3xl mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-red-600">{t('welcomeAdmin')}</h2>
                    <p className="text-gray-500">{currentUser?.full_name}</p>
                  </div>
                  <button onClick={() => setCurrentView('home')} className="p-2 bg-[#262626] rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
                  {[
                    { id: 'items', label: t('addProduct') },
                    { id: 'manage_products', label: t('manageProducts') },
                    { id: 'manage_cats', label: t('manageCategories') },
                    { id: 'new_cat', label: t('newCategory') },
                    { id: 'promotions', label: t('promotions') },
                    { id: 'delivery', label: t('deliverySettings') },
                    { id: 'orders', label: t('orders') },
                    { id: 'settings', label: t('settings') }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setAdminTab(tab.id as any);
                        if (tab.id === 'manage_products') fetchProducts(true);
                        if (tab.id === 'orders') fetchOrders();
                      }}
                      className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold transition-all ${adminTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-[#1a1a1a] text-gray-400'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Content Area */}
              <div className="flex-1 min-w-0">
                {adminTab === 'items' && (
              <form onSubmit={handleAddProduct} className="space-y-4 bg-[#1a1a1a] p-6 rounded-3xl">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">هاوپۆل</label>
                  <select 
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                    className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">ناوی کاڵا</label>
                  <input 
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="ناوی کاڵا بنووسە..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">نرخی ئێستا</label>
                    <input 
                      type="number"
                      required
                      value={newProduct.price}
                      onChange={(e) => {
                        const basePrice = Number(e.target.value);
                        setNewProduct({
                          ...newProduct, 
                          price: basePrice,
                          weights: basePrice > 0 ? [
                            { w: 250, p: basePrice * 0.25 },
                            { w: 500, p: basePrice * 0.5 },
                            { w: 750, p: basePrice * 0.75 },
                            { w: 1000, p: basePrice }
                          ] : newProduct.weights
                        });
                      }}
                      className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">نرخی پێشوو</label>
                    <input 
                      type="number"
                      value={newProduct.old_price}
                      onChange={(e) => setNewProduct({...newProduct, old_price: e.target.value})}
                      className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                      placeholder="نموونە: 12000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">داشکاندن (%)</label>
                    <input 
                      type="number"
                      value={newProduct.discount}
                      onChange={(e) => setNewProduct({...newProduct, discount: e.target.value})}
                      className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                      placeholder="نموونە: 20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#262626] p-4 rounded-xl border border-white/5">
                  <input 
                    type="checkbox"
                    id="is_limited_new"
                    checked={newProduct.is_limited === 1}
                    onChange={(e) => setNewProduct({...newProduct, is_limited: e.target.checked ? 1 : 0})}
                    className="w-5 h-5 accent-red-600"
                  />
                  <label htmlFor="is_limited_new" className="text-sm font-bold text-white cursor-pointer">
                    {t('limitedTimeOffers')} (Limited Time)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">بارکردنی وێنە</label>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'product')}
                      className="hidden"
                      id="file-upload-product"
                    />
                    <label 
                      htmlFor="file-upload-product"
                      className="w-full bg-[#262626] border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-red-600 transition-colors"
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                      ) : newProduct.image ? (
                        <img src={newProduct.image} className="h-32 w-32 object-cover rounded-xl" />
                      ) : (
                        <>
                          <Plus size={32} className="text-gray-500 mb-2" />
                          <span className="text-sm text-gray-500">وێنەیەک هەڵبژێرە لە گەلەری</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-400">کێشەکان و نرخەکان</label>
                  {newProduct.weights.map((w, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="number"
                        placeholder="گرام"
                        value={w.w}
                        onChange={(e) => {
                          const weights = [...newProduct.weights];
                          weights[idx].w = Number(e.target.value);
                          setNewProduct({...newProduct, weights});
                        }}
                        className="flex-1 bg-[#262626] border border-white/10 rounded-xl p-3 outline-none"
                      />
                      <input 
                        type="number"
                        placeholder="نرخ"
                        value={w.p}
                        onChange={(e) => {
                          const weights = [...newProduct.weights];
                          weights[idx].p = Number(e.target.value);
                          setNewProduct({...newProduct, weights});
                        }}
                        className="flex-1 bg-[#262626] border border-white/10 rounded-xl p-3 outline-none"
                      />
                      {idx > 0 && (
                        <button 
                          type="button"
                          onClick={() => {
                            const weights = newProduct.weights.filter((_, i) => i !== idx);
                            setNewProduct({...newProduct, weights});
                          }}
                          className="p-3 text-red-600"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setNewProduct({...newProduct, weights: [...newProduct.weights, { w: 0, p: 0 }]})}
                    className="text-sm text-red-600 font-bold flex items-center gap-1"
                  >
                    <Plus size={16} /> زیادکردنی کێشی تر
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors"
                  >
                    پاشەکەوتکردن
                  </button>
                </div>
              </form>
            )}

            {adminTab === 'manage_products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">هەموو کاڵاکان ({products.length})</h3>
                </div>
                {products.map(product => (
                  <div key={product.id} className="bg-[#1a1a1a] p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={product.image} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <p className="font-bold text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.price.toLocaleString()} دینار</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={20} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-600 hover:bg-red-600/10 rounded-full transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'manage_cats' && (
              <div className="space-y-4">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-[#1a1a1a] p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={cat.icon} className="w-12 h-12 rounded-xl object-cover" />
                      <span className="font-bold">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setEditingCategory(cat)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={20} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-red-600 hover:bg-red-600/10 rounded-full transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'promotions' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">بەڕێوەبردنی پرۆمۆشنەکان</h3>
                {promotions.map(promo => (
                  <div key={promo.id} className="bg-[#1a1a1a] p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={promo.image} className="w-20 h-10 rounded-lg object-cover" />
                      <span className="font-bold">{promo.title}</span>
                    </div>
                    <button 
                      onClick={() => setEditingPromotion(promo)}
                      className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full"
                    >
                      <Edit3 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'delivery' && (
              <form onSubmit={handleSaveDeliverySettings} className="space-y-6 bg-[#1a1a1a] p-6 rounded-3xl">
                <h3 className="text-xl font-bold">ڕێکخستنەکانی گەیاندن</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">نرخی گەیاندن (دینار)</label>
                  <input 
                    type="number"
                    value={deliveryFeeVal}
                    onChange={(e) => setDeliveryFeeVal(parseInt(e.target.value))}
                    className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">گەیاندنی بێبەرامبەر بۆ بڕی سەروو (دینار)</label>
                  <input 
                    type="number"
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(parseInt(e.target.value))}
                    className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-red-600 py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-600/20 active:scale-95 transition-transform"
                >
                  پاشەکەوتکردن
                </button>
              </form>
            )}

            {adminTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">{t('orders')}</h3>
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">هیچ داواکارییەک نییە</p>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-red-600 font-bold">#{order.id}</p>
                          <p className="text-xs text-gray-500">{new Date(order.date).toLocaleString()}</p>
                        </div>
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1 rounded-full outline-none ${
                            order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                            order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                            'bg-yellow-500/20 text-yellow-500'
                          }`}
                        >
                          <option value="pending">{t('pending')}</option>
                          <option value="completed">{t('completed')}</option>
                          <option value="cancelled">{t('cancelled')}</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">{t('fullName')}</p>
                          <p>{order.full_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">{t('phone')}</p>
                          <p>{order.phone}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500 text-xs">{t('address')}</p>
                          <p>{order.address}</p>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4 space-y-2">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-400">{item.quantity}x {item.name} ({item.weight}g)</span>
                            <span>{item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-white/5 pt-4 flex justify-between font-bold">
                        <span>{t('total')}</span>
                        <span className="text-red-600">{(order.total_price + order.delivery_fee).toLocaleString()} {t('dinar')}</span>
                      </div>

                      {order.location_url && (
                        <a 
                          href={order.location_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block w-full text-center py-2 bg-blue-600/10 text-blue-500 rounded-xl text-sm font-bold"
                        >
                          📍 {t('location')}
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {adminTab === 'new_cat' && (
              <form onSubmit={handleAddCategory} className="space-y-4 bg-[#1a1a1a] p-6 rounded-3xl">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">ناوی هاوپۆل</label>
                  <input 
                    type="text"
                    required
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="ناوی هاوپۆل بنووسە..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">بارکردنی ئایکۆن</label>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'category')}
                      className="hidden"
                      id="file-upload-cat"
                    />
                    <label 
                      htmlFor="file-upload-cat"
                      className="w-full bg-[#262626] border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-red-600 transition-colors"
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                      ) : newCategory.icon ? (
                        <img src={newCategory.icon} className="h-20 w-20 object-cover rounded-xl" />
                      ) : (
                        <>
                          <Plus size={32} className="text-gray-500 mb-2" />
                          <span className="text-sm text-gray-500">ئایکۆنێک هەڵبژێرە لە گەلەری</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors"
                >
                  زیادکردنی هاوپۆل
                </button>
              </form>
            )}

            {adminTab === 'settings' && (
              <div className="space-y-6 bg-[#1a1a1a] p-6 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">ڕێکخستنەکانی ئەپ</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">گۆڕینی لۆگۆ</label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 bg-[#262626] rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-white/10">
                      {appLogo ? (
                        <img src={appLogo} alt="App Logo" className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} className="text-gray-500" />
                      )}
                    </div>
                    
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label 
                      htmlFor="logo-upload"
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl cursor-pointer transition-colors"
                    >
                      {uploading ? 'باردەکرێت...' : 'گۆڕینی لۆگۆ'}
                    </label>
                    <p className="text-xs text-gray-500 text-center">
                      تکایە وێنەیەکی چوارگۆشە هەڵبژێرە بۆ باشترین دەرکەوتن
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
        ) : currentView === 'video_ai' ? (
          <VideoAI t={t} />
        ) : null}
        
        {currentView === 'home' && <Footer appLogo={appLogo} t={t} />}
      </main>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[#1a1a1a] w-full max-w-md p-6 rounded-3xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{t('editProduct')}</h3>
                <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">هاوپۆل</label>
                  <select 
                    value={editingProduct.category_id}
                    onChange={(e) => setEditingProduct({...editingProduct, category_id: e.target.value})}
                    className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">ناوی کاڵا</label>
                  <input 
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">نرخ</label>
                    <input 
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => {
                        const basePrice = Number(e.target.value);
                        setEditingProduct({
                          ...editingProduct, 
                          price: basePrice,
                          weights: basePrice > 0 ? [
                            { w: 250, p: basePrice * 0.25 },
                            { w: 500, p: basePrice * 0.5 },
                            { w: 750, p: basePrice * 0.75 },
                            { w: 1000, p: basePrice }
                          ] : editingProduct.weights
                        });
                      }}
                      className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">داشکاندن (%)</label>
                    <input 
                      type="number"
                      value={editingProduct.discount || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, discount: Number(e.target.value)})}
                      className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#262626] p-4 rounded-xl border border-white/5">
                  <input 
                    type="checkbox"
                    id="is_limited_edit"
                    checked={editingProduct.is_limited === 1}
                    onChange={(e) => setEditingProduct({...editingProduct, is_limited: e.target.checked ? 1 : 0})}
                    className="w-5 h-5 accent-red-600"
                  />
                  <label htmlFor="is_limited_edit" className="text-sm font-bold text-white cursor-pointer">
                    {t('limitedTimeOffers')} (Limited Time)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">گۆڕینی وێنە</label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'edit_product')}
                    className="hidden"
                    id="edit-file-upload-product"
                  />
                  <label 
                    htmlFor="edit-file-upload-product"
                    className="w-full bg-[#262626] border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer"
                  >
                    <img src={editingProduct.image} className="h-32 w-32 object-cover rounded-xl" />
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-400">کێشەکان و نرخەکان</label>
                  {editingProduct.weights.map((w, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="number"
                        placeholder="گرام"
                        value={w.w}
                        onChange={(e) => {
                          const weights = [...editingProduct.weights];
                          weights[idx].w = Number(e.target.value);
                          setEditingProduct({...editingProduct, weights});
                        }}
                        className="flex-1 bg-[#262626] border border-white/10 rounded-xl p-3 outline-none"
                      />
                      <input 
                        type="number"
                        placeholder="نرخ"
                        value={w.p}
                        onChange={(e) => {
                          const weights = [...editingProduct.weights];
                          weights[idx].p = Number(e.target.value);
                          setEditingProduct({...editingProduct, weights});
                        }}
                        className="flex-1 bg-[#262626] border border-white/10 rounded-xl p-3 outline-none"
                      />
                      {idx > 0 && (
                        <button 
                          type="button"
                          onClick={() => {
                            const weights = editingProduct.weights.filter((_, i) => i !== idx);
                            setEditingProduct({...editingProduct, weights});
                          }}
                          className="p-3 text-red-600"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setEditingProduct({...editingProduct, weights: [...editingProduct.weights, { w: 0, p: 0 }]})}
                    className="text-sm text-red-600 font-bold flex items-center gap-1"
                  >
                    <Plus size={16} /> زیادکردنی کێشی تر
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleUpdateProduct}
                    className="flex-1 bg-red-600 py-4 rounded-2xl font-bold"
                  >
                    پاشەکەوتکردن
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (editingProduct) {
                        handleDeleteProduct(editingProduct.id);
                        setEditingProduct(null);
                      }
                    }}
                    className="bg-red-600/20 text-red-600 p-4 rounded-2xl font-bold border border-red-600/20"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Promotion Modal */}
      <AnimatePresence>
        {editingPromotion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[#1a1a1a] w-full max-w-sm p-6 rounded-3xl space-y-4"
            >
              <h3 className="text-xl font-bold">دەستکاری پرۆمۆشن</h3>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">ناونیشان</label>
                <input 
                  type="text"
                  value={editingPromotion.title}
                  onChange={(e) => setEditingPromotion({...editingPromotion, title: e.target.value})}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">گۆڕینی وێنە</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'edit_promo')}
                  className="hidden"
                  id="edit-file-upload-promo"
                />
                <label 
                  htmlFor="edit-file-upload-promo"
                  className="w-full bg-[#262626] border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer"
                >
                  <img src={editingPromotion.image} className="w-full h-32 object-cover rounded-xl" />
                </label>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleUpdatePromotion}
                  className="flex-1 bg-red-600 py-3 rounded-xl font-bold"
                >
                  پاشەکەوت
                </button>
                <button 
                  onClick={() => setEditingPromotion(null)}
                  className="flex-1 bg-white/10 py-3 rounded-xl font-bold"
                >
                  داخستن
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {editingCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[#1a1a1a] w-full max-w-sm p-6 rounded-3xl space-y-4"
            >
              <h3 className="text-xl font-bold">دەستکاری هاوپۆل</h3>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">ناوی هاوپۆل</label>
                <input 
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">گۆڕینی ئایکۆن</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'edit_category')}
                  className="hidden"
                  id="edit-file-upload-cat"
                />
                <label 
                  htmlFor="edit-file-upload-cat"
                  className="w-full bg-[#262626] border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer"
                >
                  <img src={editingCategory.icon} className="h-20 w-20 object-cover rounded-xl" />
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleUpdateCategory}
                  className="w-full bg-red-600 py-3 rounded-xl font-bold"
                >
                  پاشەکەوت
                </button>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      if (editingCategory) {
                        handleDeleteCategory(editingCategory.id);
                        setEditingCategory(null);
                      }
                    }}
                    className="flex-1 bg-red-600/20 text-red-600 py-3 rounded-xl font-bold border border-red-600/20"
                  >
                    سڕینەوە
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 bg-white/10 py-3 rounded-xl font-bold"
                  >
                    داخستن
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <BottomNav 
        currentView={currentView}
        setCurrentView={setCurrentView}
        setShowCart={setShowCart}
        cartLength={cart.length}
        isLoggedIn={isLoggedIn}
        t={t}
      />

      <ProductDetailModal 
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
        language={language}
        t={t}
      />

      <LiveSupport language={language} t={t} />
      <BackToTop />

      <Cart 
        showCart={showCart}
        setShowCart={setShowCart}
        cart={cart}
        setCart={setCart}
        updateQuantity={updateQuantity}
        cartTotal={cartTotal}
        deliveryFee={deliveryFee}
        discountAmount={discountAmount}
        finalTotal={finalTotal}
        handleCheckout={handleCheckout}
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        validatePromoCode={validatePromoCode}
        appliedPromo={appliedPromo}
        isFirstOrder={isLoggedIn && userOrdersCount === 0}
        language={language}
        t={t}
      />

      {/* Success Modal */}
      <AnimatePresence>
        {showCheckoutSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-[#0f0f0f]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 overflow-y-auto"
            dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}
          >
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                    <Check size={32} color="white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {language === 'ku' ? 'سوپاس بۆ کڕینت!' : 
                   language === 'ar' ? 'شكراً لشرائك!' : 
                   language === 'en' ? 'Thank you for your purchase!' : 
                   'Satın aldığınız için teşekkürler!'}
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  {language === 'ku' ? 'داواکارییەکەت بە سەرکەوتوویی تۆمارکرا' : 
                   language === 'ar' ? 'تم تسجيل طلبك بنجاح' : 
                   language === 'en' ? 'Your order has been successfully registered' : 
                   'Siparişiniz başarıyla kaydedildi'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-red-600/20"
                >
                  <Star size={20} />
                  {t('rate')}
                </button>
                <button 
                  onClick={() => setShowCheckoutSuccess(false)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors"
                >
                  {t('home')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} visible={toast.show} />

      <ReviewsModal 
        showReviews={showReviews}
        setShowReviews={setShowReviews}
        reviews={reviews}
        averageRating={averageRating}
        language={language}
        t={t}
      />

      <ReviewFormModal 
        showReviewForm={showReviewForm}
        setShowReviewForm={setShowReviewForm}
        newReview={newReview}
        setNewReview={setNewReview}
        handleSubmitReview={handleSubmitReview}
        t={t}
      />
    </div>
  );
}
