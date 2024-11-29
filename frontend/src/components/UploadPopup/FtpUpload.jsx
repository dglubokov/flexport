// src/components/UploadPopup/FtpUpload.jsx

import React, { useState } from 'react';
import { fetchFTPFiles, fetchSFTPFiles, downloadFTPFile, downloadSFTPFile } from '../../services/api';
import { humanReadableSize } from '../../services/utils';

const FtpUpload = ({ currentPath, credentials, closeUploadPopup }) => {
  const [ftpData, setFtpData] = useState({
    protocol: 'FTP',
    host: '',
    port: 21,
    username: '',
    password: '',
    path: '',
    local_path: '',
    local_user_id: '',
  });
  const [ftpFiles, setFtpFiles] = useState([]);
  const [currentPathRemote, setCurrentPathRemote] = useState('');

  const handleFtpChange = (e) => {
    setFtpData({ ...ftpData, [e.target.name]: e.target.value });
  };

  const handleFTPConnection = async () => {
    const fetchFiles = ftpData.protocol === 'FTP' ? fetchFTPFiles : fetchSFTPFiles;
    const res = await fetchFiles({ ...ftpData, path: currentPathRemote });
    const data = await res.json();
    const files = data.files;

    // Sort files by type and name
    files.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

    // Add `selected` property to each file
    files.forEach((file) => {
      file.selected = false;
    });

    setFtpFiles(files);
  };

  const handleItemClick = async (item) => {
    if (item.type === 'directory') {
      const newPath = currentPathRemote ? `${currentPathRemote}/${item.name}` : `/${item.name}`;
      setCurrentPathRemote(newPath);
      const fetchFiles = ftpData.protocol === 'FTP' ? fetchFTPFiles : fetchSFTPFiles;

      const res = await fetchFiles({ ...ftpData, path: newPath });
      const data = await res.json();
      const files = data.files;

      // Sort files by type and name
      files.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });

      // Add `selected` property to each file
      files.forEach((file) => {
        file.selected = false;
      });

      setFtpFiles(files);

      // Update ftpData
      setFtpData({ ...ftpData, path: newPath });
    }
  };

  const handleDownloadSelected = async () => {
    const selectedFiles = ftpFiles.filter((file) => file.selected);
    
    // Iterate over selected files and download them
    for (const file of selectedFiles) {
      console.log(`Downloading file: ${file.name}`);
      console.log(ftpData);
      console.log(currentPathRemote);
      console.log(currentPath);
      console.log(credentials.username);
      const res = await (ftpData.protocol === 'FTP' ? downloadFTPFile : downloadSFTPFile)({
        ...ftpData, path: `${currentPathRemote}/${file.name}`, local_path: currentPath, local_user_id: credentials.username,
      });
      if (!res.ok) {
        console.error(`Error downloading file: ${file.name}`);
      }
    }

    alert('Files are downloading. Open "Sessions" to check the progress.');
    closeUploadPopup();
  };

  const handleCheckboxChange = (file) => {
    const newFiles = ftpFiles.map((f) => {
      if (f.name === file.name) {
        return { ...f, selected: !f.selected };
      }
      return f;
    });
    setFtpFiles(newFiles);
  };

  if (ftpFiles.length > 0) {
    return (
      <div className="ftp-upload-container">
        <h3>Files in {currentPathRemote || 'Root'}</h3>
        <div className="ftp-file-list">
          {ftpFiles.map((file) => (
            <div key={file.name} className="ftp-file-item">
              <input
                type="checkbox"
                checked={file.selected}
                onChange={() => handleCheckboxChange(file)}
              />
              {file.type === 'directory' ? (
                <span
                  className="ftp-folder"
                  onClick={() => handleItemClick(file)}
                  style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                >
                  📁 /{file.name} {humanReadableSize(file.size)}
                </span>
              ) : (
                <span>📄 {file.name} {humanReadableSize(file.size)}</span>
              )}
            </div>
          ))}
        </div>
        <button onClick={handleDownloadSelected} className="fancy-button">
          Download Selected
        </button>
        <button
          onClick={() => {
            if (currentPathRemote) {
              const newPath = currentPathRemote.split('/').slice(0, -1).join('/');
              setCurrentPathRemote(newPath);

              const fetchFiles = ftpData.protocol === 'FTP' ? fetchFTPFiles : fetchSFTPFiles;
              fetchFiles({ ...ftpData, path: newPath }).then((res) =>
                res.json().then((data) => setFtpFiles(data.files))
              );
            }
          }}
          className="fancy-button"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="ftp-upload-container-form">
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
