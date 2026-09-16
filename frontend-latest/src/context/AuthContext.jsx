/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import apiClient from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await apiClient.get('/auth/me');
        if (isMounted && res.data?.data) {
          setUser(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch authenticated user:', error);
        localStorage.removeItem('token');
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      const meRes = await apiClient.get('/auth/me');
      setUser(meRes.data.data);
      return meRes.data.data;
    }
  };

  const register = async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      const meRes = await apiClient.get('/auth/me');
      setUser(meRes.data.data);
      return meRes.data.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.data) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

