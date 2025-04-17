// src/components/Navbar.jsx

import React from 'react';
import viewModeIcon from '../assets/images/view.svg';
import eyeIcon from '../assets/images/eye.svg';
import eyeOffIcon from '../assets/images/eye-closed.svg';
import logoutIcon from '../assets/images/logout.svg';
import uploadIcon from '../assets/images/cloud-upload.svg';
import { handleDownload as apiHandleDownload, handleDelete as apiHandleDelete } from '../services/api';

const Navbar = ({
  viewMode,
  setViewMode,
  showHidden,
  toggleHiddenFiles,
  logout,
  setShowUploadPopup,
  setShowUploadSessionsPopup,
  showSelection,
  setShowSelection,
  files,
  setFiles,
  fetchFiles,
  currentPath,
}) => {

  const handleSelection = () => {
    // Toggle selection mode
    const newSelectionState = !showSelection;
    setShowSelection(newSelectionState);
    
    // When turning off selection mode, reset all selections
    if (!newSelectionState) {
      const resetFiles = files.map(file => ({
        ...file,
        selected: false
      }));
      setFiles(resetFiles);
    }
  };

  const checkIfFilesSelected = () => {
    return files.some(file => file.selected && file.is_file);
  };

  const handleDownload = async () => {
    const selectedFiles = files.filter(file => file.selected && file.is_file);
    
    if (selectedFiles.length === 0) {
      alert('No files selected for download');
      return;
    }
    
    for (const file of selectedFiles) {
      try {
        const response = await apiHandleDownload(file.path);
        
        // Create a blob URL from the response
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create an anchor element to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name);
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`Error downloading ${file.name}:`, error);
        alert(`Failed to download ${file.name}`);
      }
    }
  };

  const handleDelete = async () => {
    const selectedFiles = files.filter(file => file.selected && file.is_file);
    
    if (selectedFiles.length === 0) {
      alert('No files selected for deletion');
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`);
    
    if (!confirmed) return;
    
    let successCount = 0;
    
    for (const file of selectedFiles) {
      try {
        const response = await apiHandleDelete(file.path);
        if (response.ok) {
          successCount++;
        } else {
          console.error(`Error deleting ${file.name}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Error deleting ${file.name}:`, error);
      }
    }
    
    alert(`Successfully deleted ${successCount} of ${selectedFiles.length} files.`);
    
    // Refresh file list
    fetchFiles(currentPath);
  };

  return (
    <div className="navbar">
      <div className="navbar-buttons">
        <div className="button-group">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'tiles' : 'list')}
            className="icon-button"
            title={`Switch to ${viewMode === 'list' ? 'tiles' : 'list'} view`}
            aria-label="Toggle View Mode"
          >
            <img
              src={viewModeIcon}
              alt="View Mode Icon"
              className="icon"
            />
          </button>
          <button
            onClick={toggleHiddenFiles}
            className="icon-button"
            title={`${showHidden ? 'Hide' : 'Show'} hidden files`}
            aria-label="Toggle Hidden Files"
          >
            <img
              src={showHidden ? eyeIcon : eyeOffIcon}
              alt="Hidden Files Icon"
              className="icon"
            />
          </button>
          <button
            onClick={logout}
            className="icon-button"
            title="Logout"
            aria-label="Logout"
          >
            <img
              src={logoutIcon}
              alt="Logout Icon"
              className="icon"
            />
          </button>
        </div>
        
        <div className="button-group">
          {showSelection && checkIfFilesSelected() && (
            <div className="selection-buttons">
              <button 
                className="button-download" 
                onClick={handleDownload}
                title="Download selected files"
              >
                Download
              </button>
              <button 
                className="button-delete" 
                onClick={handleDelete}
                title="Delete selected files"
              >
                Delete
              </button>
            </div>
          )}
          <button
            onClick={handleSelection}
            className={`fancy-button selection-button ${showSelection ? 'active' : ''}`}
            title={showSelection ? 'Cancel selection mode' : 'Enter selection mode'}
          >
            {showSelection ? 'Cancel Selection' : 'Select Files'}
          </button>
          <button 
            onClick={() => setShowUploadPopup(true)} 
            className="fancy-button"
            title="Upload files"
          >
            <img src={uploadIcon} alt="Upload" className="upload-icon" />
            Upload
          </button>
          <button 
            onClick={() => setShowUploadSessionsPopup(true)} 
            className="fancy-button"
            title="View upload sessions"
          >
            Sessions
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;