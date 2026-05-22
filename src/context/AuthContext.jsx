import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem('discord_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.getMe();
        setUser(res.data);
      } catch (err) {
        console.error('Session restore failed:', err.message);
        localStorage.removeItem('discord_token');
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login(username, password);
      const { token, user: userData } = res.data;
      localStorage.setItem('discord_token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to login. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.register(username, password);
      const { token, user: userData } = res.data;
      localStorage.setItem('discord_token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.msg || 'Registration failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('discord_token');
    setUser(null);
    disconnectSocket();
  };

  const updateLocalUserStatus = (status) => {
    if (user) {
      setUser(prev => ({ ...prev, status }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, updateLocalUserStatus, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
