import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../lib/apiClient';
import { hasPermission, PermissionAction } from '../lib/rbac';
import { encryptPassword } from '../lib/crypto';

export interface AuthEmployee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  department?: string | null;
  jobTitle?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  employeeId?: string | null;
  employee?: AuthEmployee | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  can: (module: string, action?: PermissionAction) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('peoplepay360_token');
    const savedUser = localStorage.getItem('peoplepay360_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('peoplepay360_token');
        localStorage.removeItem('peoplepay360_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const encryptedPassword = encryptPassword(pass);
    const res = await apiClient.post('/auth/login', { email, password: encryptedPassword });
    const { token: receivedToken, user: receivedUser } = res.data.data;

    setToken(receivedToken);
    setUser(receivedUser);

    localStorage.setItem('peoplepay360_token', receivedToken);
    localStorage.setItem('peoplepay360_user', JSON.stringify(receivedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('peoplepay360_token');
    localStorage.removeItem('peoplepay360_user');
  };

  const can = (module: string, action: PermissionAction = 'read') => {
    if (!user) return false;
    return hasPermission(user.roles, module, action);
  };

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    if (user.roles.includes('Admin')) return true;
    return user.roles.some((r) => roles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        can,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
