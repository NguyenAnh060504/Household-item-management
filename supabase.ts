import { createClient } from '@supabase/supabase-js';

// Thay thế bằng URL và Key thực tế của bạn trong file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);