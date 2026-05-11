export interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  description: string | null;
  category: string;
  images: string[];
  condition: 'new' | 'used_like_new' | 'used';
  status: 'available' | 'sold';
  seller_id: string;
  created_at: string;
  seller?: UserProfile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id: string;
  content: string;
  created_at: string;
}