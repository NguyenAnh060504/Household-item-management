/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Thêm các biến khác ở đây nếu có
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}