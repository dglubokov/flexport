// src/components/UploadPopup/FtpUpload.jsx

import React, { useState } from 'react';
import { handleFtpUpload as apiHandleFtpUpload } from '../../services/api';

const FtpUpload = ({ token, currentPath, fetchFiles, closeUploadPopup }) => {
  const [ftpData, setFtpData] = useState({
    protocol: 'FTP',
    host: '',
    port: '',
    username: '',
    password: '',
    remotePath: '',
  });

  const handleFtpChange = (e) => {
    setFtpData({ ...ftpData, [e.target.name]: e.target.value });
  };

  const handleFtpUpload = async () => {
    if (!ftpData.host || !ftpData.username || !ftpData.password) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const res = await apiHandleFtpUpload(ftpData, token);
      if (res.ok) {
        alert('FTP upload initiated successfully.');
        fetchFiles(currentPath); // Refresh the file list
        closeUploadPopup();
      } else {
        alert('Error initiating FTP upload.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred during FTP upload.');
    }
  };

  return (
    <div>
      <h3>Upload from FTP/SFTP</h3>
      <label>
        Protocol:
        <select
          name="protocol"
          value={ftpData.protocol}
          onChange={handleFtpChange}
        >
          <option value="FTP">FTP</option>
          <option value="SFTP">SFTP</option>
        </select>
      </label>
      <br />
      <label>
        Host:
        <input
          type="text"
          name="host"
          value={ftpData.host}
          onChange={handleFtpChange}
        />
      </label>
      <br />
      <label>
        Port:
        <input
          type="text"
          name="port"
          value={ftpData.port}
          onChange={handleFtpChange}
        />
      </label>
      <br />
      <label>
        Username:
        <input
          type="text"
          name="username"
          value={ftpData.username}
          onChange={handleFtpChange}
        />
      </label>
      <br />
      <label>
        Password:
        <input
          type="password"
          name="password"
          value={ftpData.password}
          onChange={handleFtpChange}
        />
      </label>
      <br />
      <label>
        Remote Path:
        <input
          type="text"
          name="remotePath"
          value={ftpData.remotePath}
          onChange={handleFtpChange}
        />
      </label>
      <br />
      <button onClick={handleFtpUpload} className="fancy-button" >Upload</button>
    </div>
  );
};

export default FtpUpload;
