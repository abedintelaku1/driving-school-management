import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { mockUsers } from '../utils/mockData';
import { api } from '../utils/api';
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: any; status?: number; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
};
export const AuthContext = createContext<AuthContextType | null>(null);
export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; user?: any; status?: number; message?: string }> => {
    const { ok, data, status } = await api.login(email, password);
    console.log('Login API response:', { ok, hasData: !!data, status, data });

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

    // No mock fallback; fail fast so user sees real error
    return { success: false, status, message: (data as any)?.message || 'Invalid credentials' };
  }, []);
  
  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
  }, []);
  
  const switchRole = useCallback((role: UserRole) => {
    const userWithRole = mockUsers.find(u => u.role === role);
    if (userWithRole) {
      setUser(userWithRole);
    }
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
    logout,
    switchRole
  };
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}