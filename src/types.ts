
export interface Category {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  name_tr?: string;
  icon: string;
}

export interface Promotion {
  id: number;
  title: string;
  title_ar?: string;
  title_en?: string;
  title_tr?: string;
  image: string;
}

export interface WeightOption {
  w: number;
  p: number;
}

export interface Product {
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
  is_limited?: number;
}

export interface CartItem extends Product {
  cartId: number;
  selectedWeight: number;
  quantity: number;
  finalPrice: number;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  phone: string;
  address: string;
  role: string;
  is_admin?: number;
  is_super_admin?: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  date: string;
}
