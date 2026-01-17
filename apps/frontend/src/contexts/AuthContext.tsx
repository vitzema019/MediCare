import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getAuthToken, removeAuthToken, UserRole } from '@/lib/api';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  token: string | null;
  login: (token: string, user: AuthUser, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'auth_user';
const ROLE_STORAGE_KEY = 'auth_role';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    setToken(null);
    removeAuthToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
    // Also clear legacy storage keys
    localStorage.removeItem('patient_user');
    localStorage.removeItem('doctor_user');
    localStorage.removeItem('currentDoctor');
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = getAuthToken();
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY);

    if (storedToken && storedUser && storedRole) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setRole(storedRole as UserRole);
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        logout();
      }
    }
  }, [logout]);

  // Listen for unauthorized events from API
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = useCallback((newToken: string, userData: AuthUser, userRole: UserRole) => {
    setToken(newToken);
    setUser(userData);
    setRole(userRole);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    localStorage.setItem(ROLE_STORAGE_KEY, userRole);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Provide a default context to prevent crashes during development
    if (process.env.NODE_ENV === 'development') {
      console.warn('useAuth called outside AuthProvider, returning default values');
      return {
        user: null,
        role: null,
        token: null,
        login: () => {},
        logout: () => {},
        isAuthenticated: false,
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
