import type { AuthSession } from '../types';

// ==========================================
// Auth Mock Service - Reemplazo de supabase.auth
// ==========================================

const AUTH_KEY = 'rootwave_mock_session';

// Credenciales de demo
const DEMO_EMAIL = 'admin@rootwave.com';
const DEMO_PASSWORD = 'admin123';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const mockSession: AuthSession = {
  user: {
    id: 'admin-001',
    email: DEMO_EMAIL,
  },
};

export const login = async (email: string, password: string): Promise<{ error: Error | null }> => {
  await delay(500);
  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(mockSession));
    return { error: null };
  }
  return { error: new Error('Credenciales incorrectas. Usa admin@rootwave.com / admin123') };
};

export const logout = async (): Promise<void> => {
  await delay(200);
  localStorage.removeItem(AUTH_KEY);
};

export const getSession = (): AuthSession | null => {
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as AuthSession;
    } catch {
      return null;
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return getSession() !== null;
};
