import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'LỖI: Thiếu biến môi trường Supabase. Hãy tạo file .env dựa trên file .env.example'
  );
}

// Fallback sang string rỗng nếu thiếu env để tránh crash ứng dụng khi khởi tạo
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);