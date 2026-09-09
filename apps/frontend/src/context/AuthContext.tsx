import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenant: Tenant | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setTenant: (tenant: Tenant) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('flow_token'));
  const [tenant, setTenantState] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          if (res.data.tenant) {
            setTenantState(res.data.tenant);
          }
        } catch (err) {
          logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('flow_token', newToken);
    setToken(newToken);
    setUser(newUser);
    if (newUser.tenant) {
      setTenantState(newUser.tenant);
    }
  };

  const logout = () => {
    localStorage.removeItem('flow_token');
    setToken(null);
    setUser(null);
    setTenantState(null);
  };

  const setTenant = (newTenant: Tenant) => {
    setTenantState(newTenant);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenant,
        login,
        logout,
        setTenant,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
