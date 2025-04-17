// src/components/UploadPopup/LinksUpload.jsx

import React, { useState } from 'react';
import { handleLinksUpload as apiHandleLinksUpload } from '../../services/api';
import { toast } from 'react-toastify';
import FolderBrowser from '../FolderBrowser';

const LinksUpload = ({ currentPath, fetchFiles, closeUploadPopup }) => {
  const [linkList, setLinkList] = useState(['']);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPath, setUploadPath] = useState(currentPath);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);

  const handleLinkChange = (e, index) => {
    const newLinks = [...linkList];
    newLinks[index] = e.target.value;
    setLinkList(newLinks);
  };

  const addLinkField = () => {
    setLinkList([...linkList, '']);
  };

  const removeLinkField = (index) => {
    const newLinks = [...linkList];
    newLinks.splice(index, 1);
    setLinkList(newLinks);
  };

  const handleSelectPath = (selectedPath) => {
    setUploadPath(selectedPath);
    setShowFolderBrowser(false);
  };

  const handleLinksUpload = async () => {
    const linksToUpload = linkList.filter((link) => link.trim() !== '');
    if (linksToUpload.length === 0) {
      toast.warning('Please add at least one link.');
      return;
    }

    setIsUploading(true);
    
    try {
      const res = await apiHandleLinksUpload(linksToUpload, uploadPath);
      if (res.ok) {
        toast.success('Links are processing. Please check Sessions for progress.');
        fetchFiles(currentPath); // Refresh the file list
        closeUploadPopup();
      } else {
        const errorData = await res.json();
        toast.error(`Error initiating links upload: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred during links upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h3>Upload based on list of links</h3>
      
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
      
      {linkList.map((link, index) => (
        <div key={index} className='link-upload-container'>
          <input
            type="text"
            value={link}
            onChange={(e) => handleLinkChange(e, index)}
            placeholder="Enter URL (e.g., https://example.com/file.txt)"
          />
          <button 
            onClick={() => removeLinkField(index)} 
            className="remove-file-button"
            disabled={linkList.length === 1}
          >
            x
          </button>
        </div>
      ))}
      <div className="links-upload-buttons">
        <button onClick={addLinkField} className="fancy-button">Add Link</button>
        <button 
          onClick={handleLinksUpload} 
          className="fancy-button"
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      
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

export default LinksUpload;
