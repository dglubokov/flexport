// src/components/Navbar.jsx

import React, { useState } from 'react';
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
  fetchFiles,
  currentPath,
}) => {

  const handleSelection = () => {
    setShowSelection(!showSelection);
  }

  const checkIfFilesSelected = () => {
    return files.some(file => file.selected);
  }

  const handleDownload = () => {
    const selectedFiles = files.filter(file => file.selected && file.is_file);
    selectedFiles.forEach(file => {
      const res = apiHandleDownload(file.path);
      res.then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name);
        document.body.appendChild(link);
        link.click();
      }
      );
    });
  }

  const handleDelete = () => {
    const selectedFiles = files.filter(file => file.selected && file.is_file);
    selectedFiles.forEach(file => {
      apiHandleDelete(file.path);
    });
    fetchFiles(currentPath);
  }

  return (
  <div className="navbar">
    <div className="navbar-buttons">
      <div className="button-group">
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'tiles' : 'list')}
          className="icon-button"
          title="Toggle View Mode"
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
          title="Toggle Hidden Files"
          aria-label="Toggle Hidden Files"
        >
          <img
            src={showHidden 
              ? eyeIcon
              : eyeOffIcon }
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
          <button className='button-download' onClick={() => handleDownload()}>Download</button>
          <button className='button-delete' onClick={() => handleDelete()}>Delete</button>
          </div>
        )}
        <button
          onClick={() => handleSelection()}
          className='fancy-button'
          style={{ background: showSelection ? 'red' : 'green' }}
        >
          {showSelection ? 'Cancel Selection' : 'Select Files'}
        </button>
        <button onClick={() => setShowUploadPopup(true)} className='fancy-button'>
          <img src={uploadIcon} alt="Upload Image" className="icon upload-icon" />
        </button>
        <button onClick={() => setShowUploadSessionsPopup(true)} className='fancy-button'>Sessions</button>
        
      </div>
    </div>
  </div>
);
}

export default Navbar;
