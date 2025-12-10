import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { requestForToken, onMessageListener } from '../firebase';
import toast, { Toaster } from 'react-hot-toast';
import{BellIcon} from '@heroicons/react/24/outline';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- HELPER: Save FCM Token to Backend ---
  const saveTokenToBackend = async () => {
    const token = await requestForToken();
    if (token) {
      try {
        // The api instance already has the Authorization header if user is logged in
        await api.put('/auth/fcm-token', { token });
        console.log('FCM Token saved/updated on backend.');
      } catch (e) {
        console.error('Failed to save FCM token:', e);
      }
    }
  };

  // --- 1. Notification Listener (Foreground) ---
  useEffect(() => {
    onMessageListener()
      .then((payload) => {
        if (payload) {
          console.log('Foreground Notification Received:', payload);
          // Glass-themed toast (refractive / liquid)
          toast(
            (t) => (
              <div>
                <p className="font-bold text-white">
                  {payload.notification.title}
                </p>
                <p className="text-sm text-white/80">
                  {payload.notification.body}
                </p>
              </div>
            ),
            {
              icon: <BellIcon className="h-6 w-6 text-white" />,
              duration: 10000,
              style: {
                background: 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow:
                  'inset 0 0 18px rgba(255,255,255,0.18), 0 0 18px rgba(0,0,0,0.25)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: '20px',
                padding: '10px 14px',
              },
            }
          );
        }
      })
      .catch((err) => console.log('FCM Listener Error: ', err));
  }, []);

  // --- 2. Load User from Storage on App Start ---
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check local storage first (Remember Me)
        let token = localStorage.getItem('sshs_token');
        let userData = localStorage.getItem('sshs_user');

        // If not, check session storage
        if (!token) {
          token = sessionStorage.getItem('sshs_token');
          userData = sessionStorage.getItem('sshs_user');
        }

        if (token && userData) {
          // Set Auth Header for all future Axios requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Refresh/Save FCM Token to ensure we can reach this device
          saveTokenToBackend();
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
        // Clean up potentially corrupt data
        localStorage.removeItem('sshs_token');
        localStorage.removeItem('sshs_user');
        sessionStorage.removeItem('sshs_token');
        sessionStorage.removeItem('sshs_user');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // --- 3. Login Action ---
  const login = async (email, password, rememberMe) => {
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      const { token, ...userData } = response.data;

      // Save to storage based on preference
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('sshs_token', token);
      storage.setItem('sshs_user', JSON.stringify(userData));

      // Set Header & State
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);

      // Save FCM Token immediately after login
      saveTokenToBackend();

      return response.data;
    } catch (error) {
      console.error('Login failed', error);
      throw error.response?.data?.message || 'Login Failed';
    }
  };

  // --- 4. Logout Action ---
  const logout = () => {
    setUser(null);
    localStorage.removeItem('sshs_token');
    localStorage.removeItem('sshs_user');
    sessionStorage.removeItem('sshs_token');
    sessionStorage.removeItem('sshs_user');
    delete api.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Global Toast Container */}
      <Toaster position="top-right" />
      {!loading && children}
    </AuthContext.Provider>
  );
};
