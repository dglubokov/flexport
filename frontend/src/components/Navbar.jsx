// src/components/Navbar.jsx

import React from 'react';

const Navbar = ({
  viewMode,
  setViewMode,
  showHidden,
  toggleHiddenFiles,
  logout,
  setShowUploadPopup,
}) => (
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
            src="https://www.svgrepo.com/show/341295/view-mode-2.svg"
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
              ? "https://www.svgrepo.com/show/103061/eye.svg" 
              : "https://static.thenounproject.com/png/22249-200.png"}
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
            src="https://www.svgrepo.com/show/132889/logout.svg"
            alt="Logout Icon"
            className="icon"
          />
        </button>
      </div>
      
      <div className="button-group">
        <button onClick={() => setShowUploadPopup(true)} className='fancy-button'>
          <img src="https://www.svgrepo.com/show/446453/cloud-upload.svg" alt="Upload Image" className="icon upload-icon" />
        </button>
        <button onClick={() => setShowUploadSessionsPopup(true)} className='fancy-button'>Sessions</button>
      </div>
    </div>
  </div>
);

export default Navbar;