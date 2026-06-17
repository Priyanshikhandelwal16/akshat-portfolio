import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios authorization header globally when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('admin_token', token);
      
      // Fetch current admin profile to verify token is still valid
      axios.get('/api/auth/me')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            handleLogout();
          }
        })
        .catch(() => {
          handleLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('admin_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const handleLogin = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      if (response.data.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Authentication error';
      return { success: false, message: msg };
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  const updatePassword = async (newPassword) => {
    try {
      const response = await axios.put('/api/auth/update-password', { password: newPassword });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update password';
      return { success: false, message: msg };
    }
  };

  return (
    <AdminContext.Provider value={{
      token,
      user,
      isAuthenticated: !!token,
      loading,
      login: handleLogin,
      logout: handleLogout,
      updatePassword
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
