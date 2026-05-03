// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sd_token');
    if (token) {
      authAPI.me().then(({ data }) => {
        setUser(data.data.user);
        setProfile(data.data.profile);
      }).catch(() => localStorage.removeItem('sd_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('sd_token', data.token);
    setUser(data.user);
    setProfile(data.user.profile);
    toast.success(`Welcome back, ${data.user.profile?.full_name}!`);
    return data;
  };

  const logout = async () => {
    await authAPI.logout().catch(() => {});
    localStorage.removeItem('sd_token');
    setUser(null); setProfile(null);
    window.location.href = '/login';
  };

  const isAdmin   = profile?.role === 'admin';
  const isManager = ['admin','manager'].includes(profile?.role);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
