import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { UserProfile } from './database';
import { supabase } from './supabase';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setAuth: (user: User | null, profile: UserProfile | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setAuth: (user, profile) => set({ user, profile, loading: false }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  },
}));