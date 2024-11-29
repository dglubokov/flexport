// src/components/App.jsx

import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useFileManager from '../hooks/useFileManager';
import useUploadSessions from '../hooks/useUploadSessions';
import LoginForm from './LoginForm';
import Navbar from './Navbar';
import FileList from './FileList';
import UploadPopup from './UploadPopup/UploadPopup';
import UploadSessionsPopup from './UploadSessionsPopup';
import { humanReadableSize } from '../services/utils';

const App = () => {
  const {
    credentials,
    isAuthenticated,
    handleAuthInputChange,
    handleLogin,
    handleLogout,
    checkAuthStatus,
  } = useAuth();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const {
    files,
    currentPath,
    loading,
    spaceInfo,
    fetchSpaceInfo,
    fetchFiles,
  } = useFileManager();

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
      fetchSpaceInfo();
    }
  }, [isAuthenticated]);

  const [viewMode, setViewMode] = useState('list');
  const [showHidden, setShowHidden] = useState(false);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showUploadSessionsPopup, setShowUploadSessionsPopup] = useState(false);
  const [showFinishedSessions, setShowFinishedSessions] = useState(false);

  const {
    uploadSessions,
    cancelUploadSession,
    deleteUploadSession,
  } = useUploadSessions(showUploadSessionsPopup);

  // ---------------------------------------------
  // Handle functions
  // ---------------------------------------------

  const toggleHiddenFiles = () => {
    setShowHidden(!showHidden);
  };

  const handleItemClick = (item) => {
    if (item.is_dir) {
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      fetchFiles(newPath);
    } else {
      alert(`You clicked on file: ${item.name}`);
    }
  };

  const goBack = () => {
    if (currentPath) {
      const pathParts = currentPath.split('/');
      pathParts.pop();
      const newPath = pathParts.join('/');
      fetchFiles(newPath);
    } 
  };


  // ---------------------------------------------
  // Components
  // ---------------------------------------------

  if (!isAuthenticated) {
    return <LoginForm
      credentials={credentials}
      handleChange={handleAuthInputChange}
      handleLogin={handleLogin}
      loading={loading}
    />;
  }

  return (
    <div className="files-container">
      <Navbar
        credentials={credentials}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showHidden={showHidden}
        toggleHiddenFiles={toggleHiddenFiles}
        logout={handleLogout}
        setShowUploadPopup={setShowUploadPopup}
        setShowUploadSessionsPopup={setShowUploadSessionsPopup}
      />

      <h3>{currentPath}</h3>
      <div className="space-info-main-container">
        <div className="space-info">
          <div className="space-bar-container">
            <div
              className="space-bar-used"
              style={{ width: `${(spaceInfo.used_space / spaceInfo.total_space) * 100}%` }}
            >
              {humanReadableSize(spaceInfo.used_space)} / {humanReadableSize(spaceInfo.total_space)}
            </div>
          </div>
          <p className="available-space">
            <span>Available:</span> {humanReadableSize(spaceInfo.available_space)}
          </p>
        </div>
      </div>

      {showUploadPopup && (
        <UploadPopup
          closeUploadPopup={() => setShowUploadPopup(false)}
          currentPath={currentPath}
          fetchFiles={fetchFiles}
        />
      )}

      {showUploadSessionsPopup && (
        <UploadSessionsPopup
          uploadSessions={uploadSessions}
          cancelUploadSession={cancelUploadSession}
          deleteUploadSession={deleteUploadSession}
          showFinishedSessions={showFinishedSessions}
          setShowFinishedSessions={setShowFinishedSessions}
          closePopup={() => setShowUploadSessionsPopup(false)}
        />
      )}

      <FileList
        files={files}
        handleItemClick={handleItemClick}
        goBack={goBack}
        showHidden={showHidden}
        viewMode={viewMode}
        loading={loading}
      />
    </div>
  );
};

export default App;
