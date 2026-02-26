/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Heart, Bell, ChevronLeft, ChevronRight, 
  ShoppingBag,
  Plus, Minus, ShoppingCart, Trash2, MapPin, 
  Edit3, Gift, Clock, Check, Grid, Home, User, Menu, X, Camera, Info, Star, MessageSquare, Languages
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// Types
interface Category {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  name_tr?: string;
  icon: string;
}

interface Promotion {
  id: number;
  title: string;
  title_ar?: string;
  title_en?: string;
  title_tr?: string;
  image: string;
}

interface WeightOption {
  w: number;
  p: number;
}

interface Product {
  id: number;
  category_id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  name_tr?: string;
  price: number;
  old_price?: number;
  discount?: number;
  image: string;
  weights: WeightOption[];
}

interface CartItem extends Product {
  cartId: number;
  selectedWeight: number;
  quantity: number;
  finalPrice: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  date: string;
}

// Components
const Toast = ({ message, visible }: { message: string; visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div 
        initial={{ y: 100, opacity: 0, x: '-50%' }}
        animate={{ y: 0, opacity: 1, x: '-50%' }}
        exit={{ y: 100, opacity: 0, x: '-50%' }}
        className="fixed bottom-24 left-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg"
      >
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

const PromoSlider = ({ promotions, getName }: { promotions: Promotion[], getName: (obj: any) => string }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (promotions.length === 0) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % promotions.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [promotions.length]);

  if (promotions.length === 0) return null;

  return (
    <div className="relative mx-4 mt-2 rounded-2xl overflow-hidden h-48 bg-[#1a1a1a]">
      <div 
        className="flex transition-transform duration-500 h-full"
        style={{ transform: `translateX(${current * 100}%)` }}
      >
        {promotions.map((slide) => (
          <div key={slide.id} className="min-w-full h-full relative">
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 right-4 text-white">
              <h3 className="text-xl font-bold">{getName(slide)}</h3>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {promotions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full transition-all ${current === idx ? 'bg-red-600 w-4' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
};

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
  const [currentView, setCurrentView] = useState<'home' | 'admin' | 'login'>('home');
  const [adminTab, setAdminTab] = useState<'items' | 'manage_cats' | 'new_cat' | 'settings' | 'promotions' | 'delivery'>('items');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [appLogo, setAppLogo] = useState('');
  const [deliveryFeeVal, setDeliveryFeeVal] = useState(5000);
  const [freeThreshold, setFreeThreshold] = useState(58000);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [language, setLanguage] = useState<'ku' | 'ar' | 'en' | 'tr'>('ku');

  const getName = (obj: any) => {
    if (!obj) return '';
    if (language === 'ar' && obj.name_ar) return obj.name_ar;
    if (language === 'en' && obj.name_en) return obj.name_en;
    if (language === 'tr' && obj.name_tr) return obj.name_tr;
    if (language === 'ar' && obj.title_ar) return obj.title_ar;
    if (language === 'en' && obj.title_en) return obj.title_en;
    if (language === 'tr' && obj.title_tr) return obj.title_tr;
    return obj.name || obj.title || '';
  };


  const averageRating = useMemo(() => {
    if (reviews.length === 0) return "0.0";
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const translations = {
    ku: {
      home: "سەرەکی",
      cart: "سەبەتەی کڕین",
      about: "About",
      admin: "بەڕێوەبردن (Admin)",
      adminLogin: "چوونەژوورەوەی ئەدمین",
      language: "زمان",
      search: "گەڕان بۆ کاڵاکان...",
      reviews: "هەڵسەنگاندنەکان",
      addReview: "ڕای خۆت بنووسە",
      total: "کۆی گشتی",
      delivery: "گەیاندن",
      finalTotal: "کۆی کۆتایی",
      free: "بەخۆڕایی",
      currency: "د.ع",
      rate: "هەڵسەنگاندن",
      back: "پاشگەزبوونەوە",
      send: "ناردن",
      noReviews: "هیچ هەڵسەنگاندنێک نییە",
      version: "وەشانی",
      emptyCart: "سەبەتە بەتاڵە",
      clear: "بەتاڵکردن",
      gram: "گرام",
      dinar: "دینار",
      checkout: "تەواوکردنی کڕین",
      welcomeAdmin: "بەخێربێیت ئەدمین",
      loginError: "ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە",
      uploadSuccess: "وێنە بە سەرکەوتوویی بارکرا",
      uploadError: "هەڵە لە بارکردنی وێنە",
      promoUpdateSuccess: "پرۆمۆشن بە سەرکەوتوویی نوێکرایەوە!",
      errorOccurred: "هەڵەیەک ڕوویدا",
      selectImage: "تکایە وێنەیەک هەڵبژێرە",
      categoryUpdateSuccess: "هاوپۆل بە سەرکەوتوویی نوێکرایەوە!",
      deliverySettingsSaved: "ڕێکخستنەکانی گەیاندن پاشەکەوت کرا",
      categoryDeleteConfirm: "ئایا دڵنیایت لە سڕینەوەی ئەم هاوپۆلە؟ هەموو کاڵاکانی ناویشی دەسڕێنەوە.",
      categoryDeleteSuccess: "هاوپۆل بە سەرکەوتوویی سڕایەوە",
      categoryDeleteError: "هەڵەیەک ڕوویدا لە کاتی سڕینەوە",
      productAddSuccess: "کاڵا بە سەرکەوتوویی زیادکرا!",
      productAddError: "هەڵەیەک ڕوویدا لە کاتی زیادکردن",
      addedToCart: "زیادکرا بۆ سەبەتە!",
      newOrder: "داواکاری نوێ",
      weight: "کێش",
      quantity: "ژمارە",
      price: "نرخ",
      searchResult: "ئەنجامی گەڕان",
      noProductsFound: "هیچ کاڵایەک نەدۆزرایەوە بۆ",
      noProductsInCategory: "هیچ کاڵایەک نییە لەم هاوپۆلەدا",
      itemsCount: "کاڵا",
      manageProducts: "بەڕێوەبردنی کاڵاکان",
      manageCategories: "هاوپۆلەکان",
      newCategory: "هاوپۆلی نوێ",
      addProduct: "زیادکردنی کاڵا",
      promotions: "پرۆمۆشنەکان",
      deliverySettings: "ڕێکخستنەکانی گەیاندن",
      settings: "ڕێکخستنەکان",
      addCategorySuccess: "هاوپۆل بە سەرکەوتوویی زیادکرا!",
      editProduct: "دەستکاری کاڵا",
      deleteProductConfirm: "ئایا دڵنیایت لە سڕینەوەی ئەم کاڵایە؟",
      productDeleteSuccess: "کاڵا بە سەرکەوتوویی سڕایەوە",
      productUpdateSuccess: "کاڵا بە سەرکەوتوویی نوێکرایەوە!",
      order: "داواکردن",
      location: "شوێن",
      discount: "داشکاندن"
    },
    ar: {
      home: "الرئيسية",
      cart: "سلة التسوق",
      about: "حول",
      admin: "الإدارة (Admin)",
      adminLogin: "تسجيل دخول الأدمن",
      language: "اللغة",
      search: "البحث عن المنتجات...",
      reviews: "التقييمات",
      addReview: "اكتب رأيك",
      total: "المجموع",
      delivery: "التوصيل",
      finalTotal: "المجموع النهائي",
      free: "مجاني",
      currency: "د.ع",
      rate: "تقييم",
      back: "رجوع",
      send: "إرسال",
      noReviews: "لا توجد تقييمات",
      version: "الإصدار",
      emptyCart: "السلة فارغة",
      clear: "مسح",
      gram: "جرام",
      dinar: "دينار",
      checkout: "إتمام الشراء",
      welcomeAdmin: "أهلاً بك أيها المسؤول",
      loginError: "اسم المستخدم أو كلمة المرور غير صحيحة",
      uploadSuccess: "تم رفع الصورة بنجاح",
      uploadError: "خطأ في رفع الصورة",
      promoUpdateSuccess: "تم تحديث العرض بنجاح!",
      errorOccurred: "حدث خطأ ما",
      selectImage: "يرجى اختيار صورة",
      categoryUpdateSuccess: "تم تحديث الفئة بنجاح!",
      deliverySettingsSaved: "تم حفظ إعدادات التوصيل",
      categoryDeleteConfirm: "هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع المنتجات الموجودة فيها أيضاً.",
      categoryDeleteSuccess: "تم حذف الفئة بنجاح",
      categoryDeleteError: "حدث خطأ أثناء الحذف",
      productAddSuccess: "تم إضافة المنتج بنجاح!",
      productAddError: "حدث خطأ أثناء الإضافة",
      addedToCart: "تمت الإضافة إلى السلة!",
      newOrder: "طلب جديد",
      weight: "الوزن",
      quantity: "العدد",
      price: "السعر",
      searchResult: "نتائج البحث",
      noProductsFound: "لم يتم العثور على منتجات لـ",
      noProductsInCategory: "لا توجد منتجات في هذه الفئة",
      itemsCount: "منتجات",
      manageProducts: "إدارة المنتجات",
      manageCategories: "الفئات",
      newCategory: "فئة جديدة",
      addProduct: "إضافة منتج",
      promotions: "العروض",
      deliverySettings: "إعدادات التوصيل",
      settings: "الإعدادات",
      addCategorySuccess: "تم إضافة الفئة بنجاح!",
      editProduct: "تعديل المنتج",
      deleteProductConfirm: "هل أنت متأكد من حذف هذا المنتج؟",
      productDeleteSuccess: "تم حذف المنتج بنجاح",
      productUpdateSuccess: "تم تحديث المنتج بنجاح!",
      order: "طلب",
      location: "الموقع",
      discount: "خصم"
    },
    en: {
      home: "Home",
      cart: "Shopping Cart",
      about: "About",
      admin: "Management (Admin)",
      adminLogin: "Admin Login",
      language: "Language",
      search: "Search for products...",
      reviews: "Reviews",
      addReview: "Write a review",
      total: "Total",
      delivery: "Delivery",
      finalTotal: "Final Total",
      free: "Free",
      currency: "IQD",
      rate: "Rate",
      back: "Back",
      send: "Send",
      noReviews: "No reviews yet",
      version: "Version",
      emptyCart: "Cart is empty",
      clear: "Clear",
      gram: "g",
      dinar: "IQD",
      checkout: "Checkout",
      welcomeAdmin: "Welcome Admin",
      loginError: "Invalid username or password",
      uploadSuccess: "Image uploaded successfully",
      uploadError: "Error uploading image",
      promoUpdateSuccess: "Promotion updated successfully!",
      errorOccurred: "An error occurred",
      selectImage: "Please select an image",
      categoryUpdateSuccess: "Category updated successfully!",
      deliverySettingsSaved: "Delivery settings saved",
      categoryDeleteConfirm: "Are you sure you want to delete this category? All products inside will also be deleted.",
      categoryDeleteSuccess: "Category deleted successfully",
      categoryDeleteError: "Error occurred during deletion",
      productAddSuccess: "Product added successfully!",
      productAddError: "Error occurred during addition",
      addedToCart: "Added to cart!",
      newOrder: "New Order",
      weight: "Weight",
      quantity: "Quantity",
      price: "Price",
      searchResult: "Search Results",
      noProductsFound: "No products found for",
      noProductsInCategory: "No products in this category",
      itemsCount: "items",
      manageProducts: "Manage Products",
      manageCategories: "Categories",
      newCategory: "New Category",
      addProduct: "Add Product",
      promotions: "Promotions",
      deliverySettings: "Delivery Settings",
      settings: "Settings",
      addCategorySuccess: "Category added successfully!",
      editProduct: "Edit Product",
      deleteProductConfirm: "Are you sure you want to delete this product?",
      productDeleteSuccess: "Product deleted successfully",
      productUpdateSuccess: "Product updated successfully!",
      order: "Order",
      location: "Location",
      discount: "discount"
    },
    tr: {
      home: "Ana Sayfa",
      cart: "Alışveriş Sepeti",
      about: "Hakkında",
      admin: "Yönetim (Admin)",
      adminLogin: "Admin Girişi",
      language: "Dil",
      search: "Ürün ara...",
      reviews: "Değerlendirmeler",
      addReview: "Yorum yap",
      total: "Toplam",
      delivery: "Teslimat",
      finalTotal: "Genel Toplam",
      free: "Ücretsiz",
      currency: "IQD",
      rate: "Puanla",
      back: "Geri",
      send: "Gönder",
      noReviews: "Henüz değerlendirme yok",
      version: "Sürüm",
      emptyCart: "Sepet boş",
      clear: "Temizle",
      gram: "g",
      dinar: "IQD",
      checkout: "Ödeme",
      welcomeAdmin: "Hoş Geldiniz Yönetici",
      loginError: "Geçersiz kullanıcı adı veya şifre",
      uploadSuccess: "Resim başarıyla yüklendi",
      uploadError: "Resim yükleme hatası",
      promoUpdateSuccess: "Promosyon başarıyla güncellendi!",
      errorOccurred: "Bir hata oluştu",
      selectImage: "Lütfen bir resim seçin",
      categoryUpdateSuccess: "Kategori başarıyla güncellendi!",
      deliverySettingsSaved: "Teslimat ayarları kaydedildi",
      categoryDeleteConfirm: "Bu kategoriyi silmek istediğinizden emin misiniz? İçindeki tüm ürünler de silinecektir.",
      categoryDeleteSuccess: "Kategori başarıyla silindi",
      categoryDeleteError: "Silme sırasında hata oluştu",
      productAddSuccess: "Ürün başarıyla eklendi!",
      productAddError: "Ekleme sırasında hata oluştu",
      addedToCart: "Sepete eklendi!",
      newOrder: "Yeni Sipariş",
      weight: "Ağırlık",
      quantity: "Adet",
      price: "Fiyat",
      searchResult: "Arama Sonuçları",
      noProductsFound: "Şunun için ürün bulunamadı:",
      noProductsInCategory: "Bu kategoride ürün yok",
      itemsCount: "ürün",
      manageProducts: "Ürünleri Yönet",
      manageCategories: "Kategoriler",
      newCategory: "Yeni Kategori",
      addProduct: "Ürün Ekle",
      promotions: "Promosyonlar",
      deliverySettings: "Teslimat Ayarları",
      settings: "Ayarlar",
      addCategorySuccess: "Kategori başarıyla eklendi!",
      editProduct: "Ürünü Düzenle",
      deleteProductConfirm: "Bu ürünü silmek istediğinizden emin misiniz?",
      productDeleteSuccess: "Ürün başarıyla silindi",
      productUpdateSuccess: "Ürün başarıyla güncellendi!",
      order: "Sipariş",
      location: "Konum",
      discount: "indirim"
    }
  };

  const t = (key: keyof typeof translations['ku']) => {
    return translations[language][key] || translations['ku'][key];
  };

  // Admin Form State
  const [newProduct, setNewProduct] = useState({
    category_id: '',
    name: '',
    price: 0,
    old_price: '',
    discount: '',
    image: '',
    weights: [{ w: 250, p: 0 }]
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
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    if (response.ok) {
      setIsLoggedIn(true);
      setCurrentView('admin');
      showToastMsg(t('welcomeAdmin'));
    } else {
      showToastMsg(t('loginError'));
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
    const whatsappNumber = "9647504394038";
    
    const sendOrder = (locationUrl?: string) => {
      let message = `🛒 *${t('newOrder')}*\n\n`;
      
      cart.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        message += `   ⚖️ ${t('weight')}: ${item.weights[item.selectedWeight].w} ${t('gram')}\n`;
        message += `   🔢 ${t('quantity')}: ${item.quantity}\n`;
        message += `   💰 ${t('price')}: ${item.finalPrice.toLocaleString()} ${t('dinar')}\n\n`;
      });

      message += "--------------------------\n";
      message += `💵 ${t('total')}: ${cartTotal.toLocaleString()} ${t('dinar')}\n`;
      message += `🚚 ${t('delivery')}: ${deliveryFee === 0 ? t('free') : deliveryFee.toLocaleString() + ' ' + t('dinar')}\n`;
      message += `✨ *${t('finalTotal')}: ${(cartTotal + deliveryFee).toLocaleString()} ${t('dinar')}*\n`;

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

  const cartTotal = cart.reduce((sum, item) => sum + item.finalPrice, 0);
  const deliveryFee = cartTotal > freeThreshold ? 0 : deliveryFeeVal;

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 h-14 flex items-center justify-between px-4" dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}>
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
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
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
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
                className={`p-2 hover:bg-white/10 rounded-full transition-colors relative ${cart.length > 0 ? 'cart-pulse' : ''}`}
              >
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </header>

      {/* Side Menu Drawer */}
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
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center overflow-hidden">
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
                  onClick={() => { setShowCart(true); setShowSideMenu(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors text-gray-300"
                >
                  <ShoppingCart size={22} />
                  <span className="font-medium">{t('cart')}</span>
                </button>
                <button 
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors text-gray-300"
                >
                  <Info size={22} />
                  <span className="font-medium">{t('about')}</span>
                </button>
                
                <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                  <button 
                    onClick={() => { 
                      setCurrentView(isLoggedIn ? 'admin' : 'login'); 
                      setShowSideMenu(false); 
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentView === 'admin' || currentView === 'login' ? 'bg-red-600 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                  >
                    <User size={22} />
                    <span className="font-medium">{isLoggedIn ? t('admin') : t('adminLogin')}</span>
                  </button>

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
                          className={`py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 ${language === lang.id ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
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

      <main className="pt-14" dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}>
        {currentView === 'home' ? (
          <>
            {!isSearching && !selectedCategory && (
              <>
                <PromoSlider promotions={promotions} getName={getName} />
                <div className="px-4 mt-6 mb-2">
                  <h2 className="text-xl font-bold">{t('manageCategories')}</h2>
                </div>
                <div className="px-4 mt-2">
                  <div className="grid grid-cols-4 gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className="flex flex-col items-center gap-2 p-2 rounded-2xl transition-all bg-[#1a1a1a] hover:bg-[#262626]"
                      >
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#262626]">
                          <img src={cat.icon} alt={getName(cat)} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold text-center line-clamp-1 text-gray-400">
                          {getName(cat)}
                        </span>
                      </button>
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
            {(isSearching || selectedCategory) && (
              <div className="px-4 py-4">
                <div className="flex items-center gap-3 mb-6">
                  {selectedCategory && !isSearching && (
                    <button 
                      onClick={() => setSelectedCategory('')}
                      className="p-2 bg-[#1a1a1a] rounded-full text-red-600 hover:bg-[#262626] transition-colors"
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
                
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Grid size={48} className="opacity-20 mb-4" />
                    <p>{t('noProductsInCategory')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map(product => (
                      <motion.div 
                        layout
                        key={product.id} 
                        className="bg-[#1a1a1a] rounded-2xl overflow-hidden relative group"
                        onClick={() => setSelectedProduct(product)}
                      >
                        {product.discount && (
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg z-10 flex items-center gap-1">
                            <span>{product.discount}%</span>
                            <span>{t('discount')}</span>
                          </div>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(product, 0, 1); }}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg z-10 hover:scale-110 transition-transform"
                        >
                          <Plus size={20} />
                        </button>
                        <div className="aspect-square overflow-hidden bg-[#262626]">
                          <img src={product.image} alt={getName(product)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-medium mb-2 line-clamp-2 h-10">{getName(product)}</h3>
                          <div className="flex items-center gap-2">
                            {product.old_price && (
                              <span className="text-xs text-gray-500 line-through">{product.old_price.toLocaleString()}</span>
                            )}
                            <span className="text-red-600 font-bold text-sm">{product.price.toLocaleString()} دینار</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : currentView === 'login' ? (
          <div className="px-4 py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-8">
              <User size={40} color="white" />
            </div>
            <h2 className="text-2xl font-bold mb-8">چوونەژوورەوەی ئەدمین</h2>
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 bg-[#1a1a1a] p-8 rounded-3xl">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">ناوی بەکارهێنەر</label>
                <input 
                  type="text"
                  required
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                  placeholder="ناوی بەکارهێنەر..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">وشەی نهێنی</label>
                <input 
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-red-600 outline-none"
                  placeholder="وشەی نهێنی..."
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors mt-4"
              >
                چوونەژوورەوە
              </button>
            </form>
          </div>
        ) : (
          <div className="px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-red-600">بەڕێوەبردن</h2>
              <button 
                onClick={() => { setIsLoggedIn(false); setCurrentView('home'); }}
                className="text-sm text-gray-500 border border-white/10 px-3 py-1 rounded-full"
              >
                چوونەدەرەوە
              </button>
            </div>

            {/* Admin Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
              <button 
                onClick={() => setAdminTab('items')}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${adminTab === 'items' ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
              >
                {t('addProduct')}
              </button>
              <button 
                onClick={() => { setAdminTab('manage_products'); fetchProducts(true); }}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${adminTab === 'manage_products' ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
              >
                {t('manageProducts')}
              </button>
              <button 
                onClick={() => setAdminTab('manage_cats')}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${adminTab === 'manage_cats' ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
              >
                {t('manageCategories')}
              </button>
              <button 
                onClick={() => setAdminTab('promotions')}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${adminTab === 'promotions' ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
              >
                {t('promotions')}
              </button>
              <button 
                onClick={() => setAdminTab('delivery')}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${adminTab === 'delivery' ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
              >
                {t('deliverySettings')}
              </button>
              <button 
                onClick={() => setAdminTab('new_cat')}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${adminTab === 'new_cat' ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
              >
                {t('newCategory')}
              </button>
              <button 
                onClick={() => setAdminTab('settings')}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${adminTab === 'settings' ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
              >
                {t('settings')}
              </button>
            </div>

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
        )}
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
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-white/10 px-6 py-2 flex justify-around items-center z-40" dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}>
        <button 
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center gap-1 p-2 ${currentView === 'home' ? 'text-red-600' : 'text-gray-500'}`}
        >
          <Home size={24} />
          <span className="text-xs">{t('home')}</span>
        </button>
        <button 
          onClick={() => setShowCart(true)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${cart.length > 0 ? 'color-breathing' : 'text-gray-500'}`}
        >
          <ShoppingBag size={24} />
          <span className="text-xs">{t('order')}</span>
        </button>
        <button 
          onClick={() => setShowCart(true)}
          className="flex flex-col items-center gap-1 p-2 text-gray-500"
        >
          <ShoppingCart size={24} />
          <span className="text-xs">{t('cart')}</span>
        </button>
      </nav>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ x: language === 'en' || language === 'tr' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: language === 'en' || language === 'tr' ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-[#0f0f0f] flex flex-col"
            dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-white/10 rounded-full">
                {language === 'en' || language === 'tr' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
              </button>
              <h2 className="font-bold">{selectedProduct.name}</h2>
              <button className="p-2 hover:bg-white/10 rounded-full">
                <Heart size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="aspect-square bg-white relative">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="p-4 space-y-4">
                <h1 className="text-xl font-bold">{selectedProduct.name}</h1>
                
                <div className="flex items-center gap-3">
                  {selectedProduct.old_price && (
                    <span className="text-gray-500 line-through text-lg">{selectedProduct.old_price.toLocaleString()} دینار</span>
                  )}
                  <span className="text-3xl font-bold text-white">{selectedProduct.price.toLocaleString()} <span className="text-sm text-gray-400">دینار</span></span>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl p-4">
                  <h3 className="font-bold mb-3 text-red-600">کێش هەڵبژێرە</h3>
                  <div className="space-y-2">
                    {selectedProduct.weights.map((w, idx) => (
                      <button
                        key={idx}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 hover:border-red-600 transition-all"
                        onClick={() => {
                          addToCart(selectedProduct, idx, 1);
                          setSelectedProduct(null);
                        }}
                      >
                        <span>{w.w} {t('gram')}</span>
                        <span className="font-bold">{w.p.toLocaleString()} {t('dinar')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div 
            initial={{ x: language === 'en' || language === 'tr' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: language === 'en' || language === 'tr' ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-[#0f0f0f] flex flex-col"
            dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/10 rounded-full">
                {language === 'en' || language === 'tr' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
              </button>
              <h2 className="font-bold text-lg">{t('cart')}</h2>
              <button onClick={() => setCart([])} className="text-red-600 text-sm font-medium">{t('clear')}</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCart size={64} />
                  <p className="mt-4">{t('emptyCart')}</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="bg-[#1a1a1a] rounded-2xl p-4 flex gap-3">
                    <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{item.weights[item.selectedWeight].w} {t('gram')}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-red-600 font-bold">{item.finalPrice.toLocaleString()} {t('dinar')}</span>
                        <div className="flex items-center gap-2 bg-[#262626] rounded-lg px-2 py-1">
                          <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="text-red-600"><Minus size={16} /></button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="text-red-600"><Plus size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-white/10 bg-[#1a1a1a] space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('total')}</span>
                  <span>{cartTotal.toLocaleString()} {t('dinar')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('delivery')}</span>
                  <span className={deliveryFee === 0 ? 'text-green-500' : ''}>
                    {deliveryFee === 0 ? t('free') : deliveryFee.toLocaleString() + ' ' + t('dinar')}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                  <span>{t('finalTotal')}</span>
                  <span className="text-red-600">{(cartTotal + deliveryFee).toLocaleString()} {t('dinar')}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors"
                >
                  {t('checkout')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Reviews Modal */}
      <AnimatePresence>
        {showReviews && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviews(false)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] z-[101] rounded-t-[32px] max-h-[80vh] overflow-hidden flex flex-col"
              dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {t('reviews')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl font-black text-white">{averageRating}</span>
                    <div className="flex flex-col">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={12} 
                            className={i < Math.round(Number(averageRating)) ? 'text-yellow-500' : 'text-gray-700'} 
                            fill={i < Math.round(Number(averageRating)) ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500">لە کۆی ٥.٠</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowReviews(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t('noReviews')}</p>
                  </div>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="bg-white/5 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={i < review.rating ? 'text-yellow-500' : 'text-gray-600'} 
                              fill={i < review.rating ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {new Date(review.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'tr' ? 'tr-TR' : 'ar-IQ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Review Form Modal */}
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
              dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}
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
                    className="w-full bg-[#262626] border border-white/10 rounded-2xl p-4 min-h-[120px] outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm"
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
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-red-600/20"
                  >
                    {t('send')}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
