import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as loginApi, updateMe } from '../api/auth';
import { getUserSettings } from '../api/core';

const syncThemeFromServer = async () => {
  try {
    const prefs = await getUserSettings();
    if (prefs?.theme === 'dark' || prefs?.theme === 'light') {
      localStorage.setItem('theme', prefs.theme);
      window.dispatchEvent(new CustomEvent('hallora-theme', { detail: prefs.theme }));
    }
  } catch {
    /* settings optional */
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await getMe();
          if (userData?.role) localStorage.setItem('user_role', userData.role);
          if (userData?.app_type) localStorage.setItem('user_app_type', userData.app_type);
          setUser(userData);
          setIsAuthenticated(true);
          await syncThemeFromServer();
        } catch (error) {
          console.error('Session expired');
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const data = await loginApi(credentials);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('isAuthenticated', 'true');
    const userData = await getMe();
    if (userData?.role) localStorage.setItem('user_role', userData.role);
    if (userData?.app_type) localStorage.setItem('user_app_type', userData.app_type);
    setUser(userData);
    setIsAuthenticated(true);
    await syncThemeFromServer();
    return userData;
  };

  const updateProfile = async (profileData) => {
    const updatedUser = await updateMe(profileData);
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
