// src/hooks/useAuth.js

import { useState } from 'react';
import { login as apiLogin } from '../services/api';

const useAuth = () => {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);

  const handleChange = (e) => {
    setCreds({ ...creds, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const res = await apiLogin(creds);
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setIsAuthenticated(true);
        return data.access_token;
      } else {
        alert('Authentication failed.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred during login.');
    }
    return null;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken(null);
  };

  return {
    creds,
    isAuthenticated,
    token,
    handleChange,
    handleLogin,
    logout,
  };
};

export default useAuth;
