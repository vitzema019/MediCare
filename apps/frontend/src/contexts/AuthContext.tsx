import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '@/lib/api';

interface AuthContextType {
  user: Patient | null;
  login: (user: Patient) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Patient | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('patient_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('patient_user');
      }
    }
  }, []);

  const login = (userData: Patient) => {
    setUser(userData);
    localStorage.setItem('patient_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('patient_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
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
        login: () => {},
        logout: () => {},
        isAuthenticated: false,
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



