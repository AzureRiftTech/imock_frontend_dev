import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          // Backend returns { token: ..., user: ... } or just { token: ... } if user not found in db but token valid
          setUser(res.data.user || res.data.token); 
        } catch (err) {
          console.error('Auth check failed', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    // Backend accepts username or email. We send it as 'email' if it looks like an email, or 'username' otherwise?
    // Actually backend checks: if (username) ... if (email) ...
    // So we can send both or just one.
    // Let's send it as 'username' if it's not an email, or 'email' if it is.
    // Or just send both as the same value? No, that might be confusing.
    // Let's just send it as 'username' for now, or change backend to accept 'identifier'.
    // Looking at backend: const { username, email, password } = req.body;
    // It checks: if (username) this.where('username', username); if (email) this.orWhere('email', email);
    // So if I send { username: identifier, email: identifier, password }, it will check both.
    
    const payload = {
      username: identifier,
      email: identifier,
      password
    };
    
    const res = await api.post('/auth/login', payload);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const verifyEmail = async (otp) => {
    await api.post('/auth/verify-email', { otp });
    // refresh user info after successful verification
    const res = await api.get('/auth/me');
    setUser(res.data.user || res.data.token);
    return res;
  };

  const handleOAuthCallback = async (token) => {
    // store token and load user info
    localStorage.setItem('token', token);
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user || res.data.token);

      // check if user details exist
      try {
        const detailsRes = await api.get('/user-details/me');
        const hasDetails = !!(detailsRes && detailsRes.data && detailsRes.data.details);
        return { user: res.data.user || res.data.token, hasDetails };
      } catch (err) {
        // if fetching details fails treat as no details
        return { user: res.data.user || res.data.token, hasDetails: false };
      }
    } catch (err) {
      console.error('OAuth callback failed', err);
      localStorage.removeItem('token');
      throw err;
    }
  };

  const resendOtp = async () => {
    return api.post('/auth/resend-otp');
  };

  const forgotPassword = async (email) => {
    return api.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (email, code, newPassword) => {
    return api.post('/auth/reset-password', { email, code, newPassword });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, verifyEmail, resendOtp, forgotPassword, resetPassword, handleOAuthCallback }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
