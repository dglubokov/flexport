// src/components/Navbar.jsx

import React from 'react';
import viewModeIcon from '../assets/images/view.svg';
import eyeIcon from '../assets/images/eye.svg';
import eyeOffIcon from '../assets/images/eye-closed.svg';
import logoutIcon from '../assets/images/logout.svg';
import uploadIcon from '../assets/images/cloud-upload.svg';

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
}) => {

  const handleSelection = () => {
    setShowSelection(!showSelection);
  }

  const checkIfFilesSelected = () => {
    return files.some(file => file.selected);
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
          <button className='button-download'>Download</button>
          <button className='button-delete'>Delete</button>
          </div>
        )}
        <button onClick={() => handleSelection()} className='fancy-button'>Select</button>
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
