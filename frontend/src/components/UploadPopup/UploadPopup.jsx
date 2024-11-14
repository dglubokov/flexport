// src/components/UploadPopup/UploadPopup.jsx

import React, { useState } from 'react';
import DirectUpload from './DirectUpload';
import FtpUpload from './FtpUpload';
import LinksUpload from './LinksUpload';

const UploadPopup = ({ closeUploadPopup, token, currentPath, fetchFiles }) => {
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
            FTP Upload 
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
        token={token}
        currentPath={currentPath}
        fetchFiles={fetchFiles}
        closeUploadPopup={closeUploadPopup}
      />
    )}

    {uploadOption === 'ftp' && (
      <FtpUpload
        token={token}
        currentPath={currentPath}
        fetchFiles={fetchFiles}
        closeUploadPopup={closeUploadPopup}
      />
    )}

    {uploadOption === 'links' && (
      <LinksUpload
        token={token}
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
