import { useState, useCallback, createContext, useContext } from 'react';
import type { User, UserRole } from '../types';
import { mockUsers } from '../utils/mockData';
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
};
export const AuthContext = createContext<AuthContextType | null>(null);
export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Mock authentication - in production, this would call an API
    const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  }, []);
  const logout = useCallback(() => {
    setUser(null);
  }, []);
  const switchRole = useCallback((role: UserRole) => {
    const userWithRole = mockUsers.find(u => u.role === role);
    if (userWithRole) {
      setUser(userWithRole);
    }
  }, []);
  return {
    user,
    isAuthenticated: !!user,
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