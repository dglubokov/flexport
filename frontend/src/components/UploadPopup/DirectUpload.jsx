// src/components/UploadPopup/DirectUpload.jsx
import React, { useState } from 'react';
import { handleDirectUpload as apiHandleDirectUpload } from '../../services/api';
import { humanReadableSize } from '../../services/utils';
import { toast } from 'react-toastify';
import FolderBrowser from '../FolderBrowser';

const DirectUpload = ({ currentPath, fetchFiles, closeUploadPopup }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPath, setUploadPath] = useState(currentPath);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSelectPath = (selectedPath) => {
    setUploadPath(selectedPath);
    setShowFolderBrowser(false);
  };

  const handleDirectUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.warning('Please select files to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let successfulUploads = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const res = await apiHandleDirectUpload(uploadPath, file);

        if (res.ok) {
          successfulUploads++;
        } else {
          toast.error(`Error uploading file: ${file.name}`);
        }

        // Update upload progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      if (successfulUploads === selectedFiles.length) {
        toast.success('Files uploaded successfully.');
      } else if (successfulUploads > 0) {
        toast.warning('Some files were uploaded successfully, but some failed.');
      } else {
        toast.error('Error uploading files.');
      }

      fetchFiles(currentPath);
      closeUploadPopup();

    } catch (error) {
      console.error(error);
      toast.error('An error occurred during file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2>Direct Upload</h2>
      <p className="upload-description">Use FileZilla or similar software for the large files!</p>
      
      {/* Destination folder selection */}
      <div className="destination-folder">
        <div className="form-group">
          <label>Destination Folder:</label>
          <div className="path-display">
            <span className="current-path">{uploadPath}</span>
            <button 
              className="fancy-button browse-button"
              onClick={() => setShowFolderBrowser(true)}
              type="button"
            >
              Browse...
            </button>
          </div>
        </div>
      </div>
      
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
                <button
                  className="remove-file-button"
                  onClick={() => handleRemoveFile(index)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isUploading && (
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${uploadProgress}%`,
              height: '10px',
              backgroundColor: 'green',
            }}
          ></div>
        </div>
      )}

      <button
        onClick={handleDirectUpload}
        className="fancy-button"
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      
      {/* Folder Browser Modal */}
      {showFolderBrowser && (
        <div className="folder-browser-modal" onClick={() => setShowFolderBrowser(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <FolderBrowser
              initialPath={uploadPath}
              onPathSelect={handleSelectPath}
              onCancel={() => setShowFolderBrowser(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectUpload;
