// src/components/UploadPopup/UploadPopup.jsx

import React, { useState } from 'react';
import DirectUpload from './DirectUpload';
import FtpUpload from './FtpUpload';
import LinksUpload from './LinksUpload';

const UploadPopup = ({ closeUploadPopup, currentPath, fetchFiles, credentials }) => {
  const [uploadOption, setUploadOption] = useState('');

  const handleUploadOptionSelect = (option) => {
    setUploadOption(option);
  };

  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('modal-overlay')) {
      closeUploadPopup();
    }
  };

  return (
<div className="modal-overlay" onClick={handleOverlayClick}>
  <div className="upload-popup" onClick={(e) => e.stopPropagation()}>
    
    {uploadOption === '' && (
      <div className="upload-popup-container">
        <h2>Select Upload Option</h2>
        <div className="upload-option-container">

          <button onClick={() => handleUploadOptionSelect('direct')} className='fancy-button upload-option'>
            Direct Upload
          </button>
          <div className="upload-description">From Your Computer</div>
          
          <button onClick={() => handleUploadOptionSelect('ftp')} className='fancy-button upload-option'>
            From Server to Server
          </button>
          <div className="upload-description">From FTP Server (e.g. NovoGene)</div>
          
          <button onClick={() => handleUploadOptionSelect('links')} className='fancy-button upload-option'>
            Links Upload 
          </button>
          <div className="upload-description">Link Based Uploading</div>
          
        </div>
        
      </div>
    )}

    {uploadOption === 'direct' && (
      <DirectUpload
        currentPath={currentPath}
        fetchFiles={fetchFiles}
        closeUploadPopup={closeUploadPopup}
      />
    )}

    {uploadOption === 'ftp' && (
      <FtpUpload
        currentPath={currentPath}
        credentials={credentials}
        closeUploadPopup={closeUploadPopup}
      />
    )}

    {uploadOption === 'links' && (
      <LinksUpload
        currentPath={currentPath}
        fetchFiles={fetchFiles}
        closeUploadPopup={closeUploadPopup}
      />
    )}

    {uploadOption !== '' && (
      <div className="upload-popup-footer">
      <button onClick={() => handleUploadOptionSelect('')} className='fancy-button back-button'>
        Back
      </button>
      <button onClick={closeUploadPopup} className='fancy-button cancel-button'>Close</button>
      </div>
    )}

    {uploadOption === '' && (
      <button onClick={closeUploadPopup} className='fancy-button cancel-button'>Close</button>
    )}
    
  </div>
</div>
  );
};

export default UploadPopup;
