import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface User {
  id: number;
  username: string;
  isGuest: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

// API client functions
const api = {
  async login(username: string, password: string): Promise<{ user: User }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include', // Include session cookies
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    return response.json();
  },

  async register(username: string, password: string): Promise<{ user: User }> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    return response.json();
  },

  async guest(): Promise<{ user: User }> {
    const response = await fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Guest login failed');
    }
    
    return response.json();
  },

  async me(): Promise<{ user: User | null }> {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to check authentication');
    }
    
    return response.json();
  },

  async logout(): Promise<{ success: boolean }> {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    
    return response.json();
  },
};

export const useAuth = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    isLoading: false,
    error: null,

    login: async (username: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const { user } = await api.login(username, password);
        set({ user, isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    register: async (username: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const { user } = await api.register(username, password);
        set({ user, isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    loginAsGuest: async () => {
      set({ isLoading: true, error: null });
      try {
        const { user } = await api.guest();
        set({ user, isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Guest login failed';
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    logout: async () => {
      set({ isLoading: true, error: null });
      try {
        await api.logout();
        set({ user: null, isLoading: false });
      } catch (error) {
        console.error('Logout error:', error);
        // Even if logout fails on server, clear local state
        set({ user: null, isLoading: false });
      }
    },

    checkAuth: async () => {
      set({ isLoading: true, error: null });
      try {
        const { user } = await api.me();
        set({ user, isLoading: false });
      } catch (error) {
        set({ user: null, isLoading: false });
      }
    },

    clearError: () => set({ error: null }),
  }))
);