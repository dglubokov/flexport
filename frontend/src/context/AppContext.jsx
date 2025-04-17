// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  login as apiLogin, 
  logout as apiLogout, 
  checkAuth as apiCheckAuth,
  fetchFiles as apiFetchFiles,
  fetchSpaceInfo as apiFetchSpaceInfo,
  fetchUploadSessions as apiFetchUploadSessions, 
  deleteUploadSession as apiDeleteUploadSession
} from '../services/api';

// Create the context
const AppContext = createContext(null);

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Provider component
export const AppProvider = ({ children }) => {
  // Auth state
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // File manager state
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [spaceInfo, setSpaceInfo] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const [showHidden, setShowHidden] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  
  // Upload sessions state
  const [uploadSessions, setUploadSessions] = useState([]);
  
  // UI state
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showUploadSessionsPopup, setShowUploadSessionsPopup] = useState(false);

  // Auth actions
  const handleAuthInputChange = ({ target: { name, value } }) =>
    setCredentials((prev) => ({ ...prev, [name]: value }));

  const handleLogin = async () => {
    try {
      const response = await apiLogin(credentials);
      const data = response.ok ? await response.json() : { success: false };
      setIsAuthenticated(data.success || false);
      if (!data.success) alert('Authentication failed.');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await apiLogout();
      const data = response.ok ? await response.json() : { success: false };
      setIsAuthenticated(!data.success);
      if (!data.success) alert('Logout failed.');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await apiCheckAuth();
      const data = response.ok ? await response.json() : { authenticated: false };
      if (data.authenticated) {
        setCredentials((prev) => ({ ...prev, username: data.username }));
      }
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Error checking authentication', error);
      setIsAuthenticated(false);
    }
  };

  // File manager actions
  const fetchFiles = async (path = '') => {
    setLoading(true);
    try {
      const res = await apiFetchFiles(path);
      if (res.ok) {
        const data = await res.json();
        const fetchedFiles = data.items;
        
        // Add selected property to each file
        fetchedFiles.forEach((file) => {
          file.selected = !!selectedItems[file.name];
        });
        
        setFiles(fetchedFiles);
        setCurrentPath(data.current_path);
        fetchSpaceInfo();
      } else {
        if (res.status === 401) {
          alert('Session expired. Please log in again.');
          setIsAuthenticated(false);
        } else {
          alert('Error retrieving files.');
        }
      }
    } catch (error) {
      alert('An error occurred while fetching files.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpaceInfo = async () => {
    try {
      const res = await apiFetchSpaceInfo();
      if (res.ok) {
        const data = await res.json();
        setSpaceInfo(data);
      } else {
        alert('Error retrieving space info.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching space info.');
    }
  };
  
  // Upload sessions actions
  const fetchUploadSessions = async () => {
    try {
      const res = await apiFetchUploadSessions(credentials.username);
      if (res.ok) {
        const data = await res.json();
        const sessions = data.sessions;

        // Sort by started_at_unix
        sessions.sort((a, b) => b.started_at_unix - a.started_at_unix);

        setUploadSessions(sessions);
      } else {
        alert('Error retrieving upload sessions');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching upload sessions');
    }
  };
  
  const deleteUploadSession = async (sessionId) => {
    try {
      const res = await apiDeleteUploadSession(sessionId);
      if (res.ok) {
        alert('Upload session deleted');
        fetchUploadSessions();
      } else {
        alert('Error deleting upload session');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while deleting upload session');
    }
  };

  // Initialize auth status
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Initialize file listing when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
      fetchSpaceInfo();
    }
  }, [isAuthenticated]);
  
  // Fetch upload sessions when popup is shown
  useEffect(() => {
    let interval;
    if (showUploadSessionsPopup && isAuthenticated) {
      fetchUploadSessions();
      interval = setInterval(fetchUploadSessions, 5000); // Refresh every 5 seconds
    }
    return () => clearInterval(interval);
  }, [showUploadSessionsPopup, isAuthenticated]);

  const toggleHiddenFiles = () => setShowHidden(!showHidden);

  const goBack = () => {
    if (currentPath) {
      const pathParts = currentPath.split('/');
      pathParts.pop();
      const newPath = pathParts.join('/');
      fetchFiles(newPath);
    }
  };

  // Provide all the state and actions through context
  const value = {
    // Auth state and actions
    credentials,
    isAuthenticated,
    handleAuthInputChange,
    handleLogin,
    handleLogout,
    checkAuthStatus,
    
    // File manager state and actions
    files,
    setFiles,
    currentPath,
    loading,
    spaceInfo,
    fetchSpaceInfo,
    fetchFiles,
    goBack,
    
    // Upload sessions state and actions
    uploadSessions,
    fetchUploadSessions,
    deleteUploadSession,
    
    // UI state and actions
    viewMode,
    setViewMode,
    showHidden,
    toggleHiddenFiles,
    showSelection,
    setShowSelection,
    showUploadPopup,
    setShowUploadPopup,
    showUploadSessionsPopup,
    setShowUploadSessionsPopup,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};