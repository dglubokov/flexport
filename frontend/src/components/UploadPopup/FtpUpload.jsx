// src/components/UploadPopup/FtpUpload.jsx

import React, { useState } from 'react';
import { handleFtpUpload as apiHandleFtpUpload } from '../../services/api';

const FtpUpload = ({ currentPath, fetchFiles, closeUploadPopup }) => {
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

  const handleFTPConnection = async () => {
    // TODO
  }

  return (
    <div className="ftp-upload-container">
      <h3>Upload from Server to Server</h3>
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
      <button onClick={handleFTPConnection} className="fancy-button" >Connect</button>
    </div>
  );
};

export default FtpUpload;
