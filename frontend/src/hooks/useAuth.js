// src/hooks/useAuth.js

import { useState } from 'react';
import { login as apiLogin, logout as apiLogout, checkAuth as apiCheckAuth } from '../services/api';

const useAuth = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthInputChange = ({ target: { name, value } }) =>
    setCredentials((prev) => ({ ...prev, [name]: value }));

  /**
   * Attempt to log in with the provided credentials.
   */
  const handleLogin = async () => {
    try {
      const response = await apiLogin(credentials);
      const data = response.ok ? await response.json() : { success: false };
      
      // Update authentication status
      setIsAuthenticated(data.success || false);

      // Notify user if login failed
      if (!data.success) alert('Authentication failed.');

    } catch (error) {
      console.error('Login error:', error);
    }
  };

  /**
   * Attempt to log out.
   * If successful, update the authentication status.
   * If unsuccessful, notify the user.
   */
  const handleLogout = async () => {
    try {
      const response = await apiLogout();
      const data = response.ok ? await response.json() : { success: false };

      // Update authentication status
      setIsAuthenticated(!data.success);

      // Notify user if logout failed
      if (!data.success) alert('Logout failed.');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  /**
   * Check the current authentication status.
   * If the user is authenticated, update the state.
   * If the user is not authenticated, update the state to false.
   * If an error occurs, log the error and update the state to false.
   */
  const checkAuthStatus = async () => {
    try {
      const response = await apiCheckAuth();
      const data = response.ok ? await response.json() : { authenticated: false };

      // Update authentication status
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Error checking authentication', error);
      setIsAuthenticated(false);
    }
  };

  return {
    credentials,
    isAuthenticated,
    handleAuthInputChange,
    handleLogin,
    handleLogout,
    checkAuthStatus,
  };
};

export default useAuth;
