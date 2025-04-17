// src/components/FolderBrowser.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const FolderBrowser = ({ initialPath, onPathSelect, onCancel }) => {
  // Function to normalize path
  const normalizePath = (path) => {
    if (!path) return '/';
    const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
    return withLeadingSlash.replace(/\/+/g, '/');
  };
  
  // Function to get parent path
  const getParentPath = (path) => {
    const normalized = normalizePath(path);
    if (normalized === '/') return '/';
    
    const segments = normalized.split('/').filter(Boolean);
    segments.pop();
    return segments.length === 0 ? '/' : `/${segments.join('/')}`;
  };

  const [currentPath, setCurrentPath] = useState(normalizePath(initialPath || '/'));
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pathHistory, setPathHistory] = useState([normalizePath(initialPath || '/')]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Load folders for the current path
  useEffect(() => {
    fetchFolders(currentPath);
  }, [currentPath]);

  const fetchFolders = async (path) => {
    const normalizedPath = normalizePath(path);
    setLoading(true);
    try {
      const response = await fetch(`http://lifespan:8009/list_files?path=${encodeURIComponent(normalizedPath)}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
        } else {
          toast.error('Error loading folders. Please try again.');
        }
        return;
      }
      
      const data = await response.json();
      
      // Filter only directories
      const folderList = data.items.filter(item => item.is_dir);
      
      setFolders(folderList);
      
      // Update path from response (in case there was normalization on server)
      if (data.current_path) {
        const normalized = normalizePath(data.current_path);
        if (normalized !== currentPath) {
          setCurrentPath(normalized);
        }
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderPath) => {
    const normalized = normalizePath(folderPath);
    // Add new path to history, removing any "forward" history
    const newHistory = [...pathHistory.slice(0, historyIndex + 1), normalized];
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(normalized);
  };

  const handleFolderClick = (folder) => {
    let newPath;
    if (currentPath === '/') {
      newPath = `/${folder.name}`;
    } else {
      newPath = `${currentPath}/${folder.name}`;
    }
    
    navigateToFolder(newPath);
  };

  const handleGoUp = () => {
    // Don't go up past root
    if (currentPath === '/') return;
    
    const parentPath = getParentPath(currentPath);
    navigateToFolder(parentPath);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(pathHistory[historyIndex - 1]);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(pathHistory[historyIndex + 1]);
    }
  };

  const renderBreadcrumbs = () => {
    // If we're at root, just show the root slash
    if (currentPath === '/') {
      return (
        <div className="breadcrumb-container">
          <span className="breadcrumb-item">
            <span className="breadcrumb-current">/</span>
          </span>
        </div>
      );
    }
    
    // Otherwise, build the breadcrumb trail
    const segments = currentPath.split('/').filter(Boolean);
    const breadcrumbItems = [];
    
    // Add root item
    breadcrumbItems.push(
      <span key="root" className="breadcrumb-item">
        <span 
          className="breadcrumb-link"
          onClick={() => navigateToFolder('/')}
          title="Navigate to root"
        >
          /
        </span>
      </span>
    );
    
    // Build path segments with proper navigation
    let pathSoFar = '';
    segments.forEach((segment, index) => {
      pathSoFar += '/' + segment;
      const segmentPath = pathSoFar; // Create closure variable
      
      breadcrumbItems.push(
        <span key={`segment-${index}`} className="breadcrumb-item">
          <span 
            className={index === segments.length - 1 ? "breadcrumb-current" : "breadcrumb-link"}
            onClick={() => navigateToFolder(segmentPath)}
            title={index === segments.length - 1 ? "Current location" : `Navigate to ${segmentPath}`}
          >
            {segment}
          </span>
        </span>
      );
    });
    
    return (
      <div className="breadcrumb-container">
        {breadcrumbItems}
      </div>
    );
  };

  const handleSelectCurrentFolder = () => {
    onPathSelect(currentPath);
  };

  return (
    <div className="folder-browser">
      <div className="folder-browser-header">
        <h3>Select Destination Folder</h3>
        
        <div className="navigation-controls">
          <button 
            className="icon-button" 
            onClick={handleGoBack} 
            disabled={historyIndex <= 0}
            title="Go back"
          >
            ←
          </button>
          <button 
            className="icon-button" 
            onClick={handleGoForward} 
            disabled={historyIndex >= pathHistory.length - 1}
            title="Go forward"
          >
            →
          </button>
          <button 
            className="icon-button" 
            onClick={handleGoUp}
            disabled={currentPath === '/'}
            title="Go up one level"
          >
            ↑
          </button>
        </div>
        
        {renderBreadcrumbs()}
      </div>
      
      <div className="folder-list-container">
        {loading ? (
          <div className="loading-message">Loading folders...</div>
        ) : folders.length === 0 ? (
          <div className="empty-folder-message">No subfolders found</div>
        ) : (
          <div className="folder-list">
            {folders.map((folder, index) => (
              <div 
                key={index}
                className="folder-item"
                onClick={() => handleFolderClick(folder)}
                title={folder.name}
              >
                <div className="folder-icon">📁</div>
                <div className="folder-name">{folder.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="folder-browser-footer">
        <div className="selected-path">
          Current path: <strong>{currentPath}</strong>
        </div>
        <div className="action-buttons">
          <button 
            className="fancy-button cancel-button" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="fancy-button" 
            onClick={handleSelectCurrentFolder}
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderBrowser;