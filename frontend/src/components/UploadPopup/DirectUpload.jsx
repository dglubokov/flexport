// src/components/UploadPopup/DirectUpload.jsx

import React, { useState } from 'react';
import { handleDirectUpload as apiHandleDirectUpload } from '../../services/api';
import { humanReadableSize } from '../../services/utils';

const DirectUpload = ({ token, currentPath, fetchFiles, closeUploadPopup }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleDirectUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));
    formData.append('current_path', currentPath);

    try {
      setIsUploading(true);
      const res = await apiHandleDirectUpload(formData, token);
      if (res.ok) {
        alert('Files uploaded successfully.');
        fetchFiles(currentPath);
        closeUploadPopup();
      } else {
        alert('Error uploading files.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred during file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2>Direct Upload</h2>
      <p className="upload-description">Use FileZilla or similar software for large files!</p>
      <div className="direct-upload-container">
        
        <input 
          type="file" 
          multiple 
          id="file-upload" 
          className="fancy-input" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
        />
        <label htmlFor="file-upload" className="fancy-input-label">
          Select Files
        </label>

        {selectedFiles.length > 0 && (
          <div className="file-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <span>
                  {file.name} - {humanReadableSize(file.size)}
                </span>
                {file.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{ width: '50px', height: '50px', marginLeft: '10px' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

      </div>
      <button 
          onClick={handleDirectUpload} 
          className="fancy-button" 
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
    </div>
  );
};

export default DirectUpload;