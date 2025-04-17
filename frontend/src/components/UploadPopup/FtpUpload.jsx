// src/components/UploadPopup/FtpUpload.jsx

import React, { useState, useEffect } from 'react';
import { fetchFTPFiles, fetchSFTPFiles, downloadFTPFile, downloadSFTPFile } from '../../services/api';
import { humanReadableSize } from '../../services/utils';
import { toast } from 'react-toastify';

const FtpUpload = ({ currentPath, credentials, closeUploadPopup }) => {
  const defaultPort = {
    FTP: 21,
    SFTP: 22
  };

  const [ftpData, setFtpData] = useState({
    protocol: 'SFTP',
    host: '',
    port: defaultPort.SFTP,
    username: '',
    password: '',
    path: '/',
    local_path: currentPath,
    local_user_id: credentials.username,
  });
  
  const [ftpFiles, setFtpFiles] = useState([]);
  const [currentRemotePath, setCurrentRemotePath] = useState('/');
  const [pathHistory, setPathHistory] = useState(['/']);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Update port when protocol changes
  useEffect(() => {
    setFtpData(prevData => ({
      ...prevData,
      port: defaultPort[prevData.protocol]
    }));
  }, [ftpData.protocol]);

  // Update local path when currentPath changes
  useEffect(() => {
    setFtpData(prevData => ({
      ...prevData,
      local_path: currentPath
    }));
  }, [currentPath]);

  const handleFtpChange = (e) => {
    const { name, value } = e.target;
    setFtpData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleProtocolChange = (protocol) => {
    setFtpData(prevData => ({
      ...prevData,
      protocol,
      port: defaultPort[protocol]
    }));
  };

  const validateConnection = () => {
    if (!ftpData.host.trim()) {
      toast.error('Host is required');
      return false;
    }
    
    if (!ftpData.username.trim()) {
      toast.error('Username is required');
      return false;
    }
    
    if (!ftpData.password.trim()) {
      toast.error('Password is required');
      return false;
    }
    
    return true;
  };

  const handleFetchFiles = async (path = '/') => {
    if (!validateConnection()) return;
    
    setIsLoading(true);
    setConnectionError('');
    
    try {
      const fetchFunction = ftpData.protocol === 'FTP' ? fetchFTPFiles : fetchSFTPFiles;
      
      const res = await fetchFunction({
        ...ftpData,
        path
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to fetch files');
      }

      const data = await res.json();
      const files = data.files || [];

      // Sort files (directories first, then by name)
      files.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });

      // Add selected property to each file
      files.forEach(file => {
        file.selected = false;
      });

      setFtpFiles(files);
      setCurrentRemotePath(path);
      
      // Update path history for navigation
      if (!pathHistory.includes(path)) {
        setPathHistory(prev => [...prev, path]);
      }
    } catch (error) {
      console.error('FTP/SFTP Error:', error);
      setConnectionError(error.message || 'Failed to connect to server');
      toast.error(error.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemClick = (item) => {
    if (item.type === 'directory') {
      // Build the new path (handle both absolute and relative paths)
      let newPath;
      if (currentRemotePath.endsWith('/')) {
        newPath = `${currentRemotePath}${item.name}`;
      } else {
        newPath = `${currentRemotePath}/${item.name}`;
      }
      
      handleFetchFiles(newPath);
    }
  };

  const handleCheckboxChange = (file) => {
    setFtpFiles(prevFiles => 
      prevFiles.map(f => 
        f.name === file.name ? { ...f, selected: !f.selected } : f
      )
    );
  };

  const handleDownloadSelected = async () => {
    const selectedFiles = ftpFiles.filter(file => file.selected);
    
    if (selectedFiles.length === 0) {
      toast.warning('No files selected for download');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const downloadFunction = ftpData.protocol === 'FTP' ? downloadFTPFile : downloadSFTPFile;
      
      for (const file of selectedFiles) {
        const filePath = currentRemotePath.endsWith('/') 
          ? `${currentRemotePath}${file.name}` 
          : `${currentRemotePath}/${file.name}`;
          
        await downloadFunction({
          ...ftpData,
          path: filePath
        });
      }
      
      toast.success(`${selectedFiles.length} files queued for download. Check Sessions to monitor progress.`);
      closeUploadPopup();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error starting downloads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (currentRemotePath === '/') return;
    
    // Extract parent directory path
    const pathParts = currentRemotePath.split('/').filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.length ? `/${pathParts.join('/')}` : '/';
    
    handleFetchFiles(parentPath);
  };

  const renderFilesList = () => {
    if (ftpFiles.length === 0) {
      return <p className="empty-directory-message">This directory is empty</p>;
    }

    return (
      <div className="ftp-file-list">
        {ftpFiles.map((file, index) => (
          <div key={index} className="ftp-file-item">
            <div className="ftp-file-checkbox">
              <input
                type="checkbox"
                checked={file.selected || false}
                onChange={() => handleCheckboxChange(file)}
                disabled={file.type === 'directory'}
              />
            </div>
            <div 
              className={`ftp-file-name ${file.type === 'directory' ? 'ftp-directory' : ''}`}
              onClick={() => file.type === 'directory' && handleItemClick(file)}
            >
              {file.type === 'directory' ? '📁' : '📄'} {file.name}
            </div>
            <div className="ftp-file-size">
              {humanReadableSize(file.size || 0)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Connected view - showing remote files
  if (ftpFiles.length > 0 || connectionError) {
    return (
      <div className="ftp-upload-container">
        {isLoading && (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        )}
        
        <div className="ftp-header">
          <h2>{ftpData.protocol} Connection: {ftpData.host}</h2>
          <div className="ftp-path-display">
            Current path: {currentRemotePath || '/'}
          </div>
        </div>
        
        {connectionError && (
          <div className="connection-error">
            <div className="error-message">Error: {connectionError}</div>
            <button 
              className="fancy-button"
              onClick={() => handleFetchFiles('/')}
            >
              Retry
            </button>
          </div>
        )}
        
        <div className="ftp-actions-top">
          <button 
            onClick={handleGoBack}
            className="fancy-button back-button"
            disabled={currentRemotePath === '/'}
          >
            Go Back
          </button>
          <button 
            onClick={() => handleFetchFiles(currentRemotePath)}
            className="fancy-button"
            title="Refresh"
          >
            Refresh
          </button>
        </div>

        {renderFilesList()}
        
        <div className="ftp-actions-bottom">
          <button 
            onClick={handleDownloadSelected}
            className="fancy-button"
            disabled={!ftpFiles.some(file => file.selected)}
          >
            Download Selected
          </button>
        </div>
      </div>
    );
  }

  // Connection form view
  return (
    <div className="ftp-upload-container-form">
      {isLoading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      
      <h2>Upload from Server to Server</h2>
      
      <div className="ftp-connection-form">
        <div className="protocol-select">
          <div 
            className={`protocol-option ${ftpData.protocol === 'FTP' ? 'active' : ''}`}
            onClick={() => handleProtocolChange('FTP')}
          >
            FTP
          </div>
          <div 
            className={`protocol-option ${ftpData.protocol === 'SFTP' ? 'active' : ''}`}
            onClick={() => handleProtocolChange('SFTP')}
          >
            SFTP
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="host">Host:</label>
          <input
            id="host"
            type="text"
            name="host"
            value={ftpData.host}
            onChange={handleFtpChange}
            className="form-control"
            placeholder="ftp.example.com"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="port">Port:</label>
            <input
              id="port"
              type="text"
              name="port"
              value={ftpData.port}
              onChange={handleFtpChange}
              className="form-control"
              placeholder={ftpData.protocol === 'FTP' ? '21' : '22'}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              name="username"
              value={ftpData.username}
              onChange={handleFtpChange}
              className="form-control"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            name="password"
            value={ftpData.password}
            onChange={handleFtpChange}
            className="form-control"
          />
        </div>

        <button 
          onClick={() => handleFetchFiles('/')} 
          className="fancy-button"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  );
};

export default FtpUpload;