// src/components/UploadPopup/LinksUpload.jsx

import React, { useState } from 'react';
import { handleLinksUpload as apiHandleLinksUpload } from '../../services/api';

const LinksUpload = ({ currentPath, fetchFiles, closeUploadPopup }) => {
  const [linkList, setLinkList] = useState(['']);

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

  const handleLinksUpload = async () => {
    const linksToUpload = linkList.filter((link) => link.trim() !== '');
    if (linksToUpload.length === 0) {
      alert('Please add at least one link.');
      return;
    }

    try {
      const res = await apiHandleLinksUpload(linksToUpload, currentPath);
      if (res.ok) {
        alert('Links are processing. Please check Sessions for progress.');
        fetchFiles(currentPath); // Refresh the file list
        closeUploadPopup();
      } else {
        alert('Error initiating links upload.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred during links upload.');
    }
  };

  return (
    <div>
      <h3>Upload based on list of links</h3>
      {linkList.map((link, index) => (
        <div key={index} className='link-upload-container'>
          <input
            type="text"
            value={link}
            onChange={(e) => handleLinkChange(e, index)}
          />
          <button onClick={() => removeLinkField(index)} className="remove-file-button" >x</button>
        </div>
      ))}
      <div className="links-upload-buttons">
        <button onClick={addLinkField} className="fancy-button" >Add Link</button>
        <button onClick={handleLinksUpload} className="fancy-button" >Upload</button>
      </div>
    </div>
  );
};

export default LinksUpload;
