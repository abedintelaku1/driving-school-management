import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../utils/api';
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: any; status?: number; message?: string }>;
  logout: () => void;
};
export const AuthContext = createContext<AuthContextType | null>(null);
export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; user?: any; status?: number; message?: string }> => {
    const { ok, data, status } = await api.login(email, password);
    const errMsg = (data as any)?.message;

    if (ok && data && data.user) {
      const userData = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || ''
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    // Server unreachable (proxy ECONNREFUSED → 502) or network error
    const serverUnreachable = status === 502 || status === 503 || status === 504 ||
      (status === 500 && (!errMsg || errMsg.includes('server') || errMsg.includes('try again')));
    const message = serverUnreachable
      ? 'Serveri nuk është i disponueshëm. Nisni backend-in (porti 5000).'
      : errMsg || 'Kredencialet janë të gabuara.';
    return { success: false, status, message };
  }, []);
  
  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
  }, []);
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const { ok, data } = await api.me();
        if (ok && data?.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || ''
          });
        } else {
          // Token invalid, clear it
          api.clearToken();
        }
      } catch (error) {
        // Network error or other issue, clear token
        api.clearToken();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  return {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout
  };
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}