// src/components/App.jsx

import React, { useState } from 'react';
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
    creds,
    isAuthenticated,
    token,
    handleChange,
    handleLogin,
    logout,
  } = useAuth();

  const {
    files,
    currentPath,
    loading,
    spaceInfo,
    fetchFiles,
  } = useFileManager(token);

  const [viewMode, setViewMode] = useState('list');
  const [showHidden, setShowHidden] = useState(false);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showUploadSessionsPopup, setShowUploadSessionsPopup] = useState(false);
  const [showFinishedSessions, setShowFinishedSessions] = useState(false);

  const {
    uploadSessions,
    cancelUploadSession,
    deleteUploadSession,
  } = useUploadSessions(token, showUploadSessionsPopup);

  const toggleHiddenFiles = () => {
    setShowHidden(!showHidden);
  };

  const handleItemClick = (item) => {
    if (item.is_dir) {
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      fetchFiles(newPath, token);
    } else {
      alert(`You clicked on file: ${item.name}`);
    }
  };

  const goBack = () => {
    if (currentPath) {
      const pathParts = currentPath.split('/');
      pathParts.pop();
      const newPath = pathParts.join('/');
      fetchFiles(newPath, token);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginForm
        creds={creds}
        handleChange={handleChange}
        handleLogin={async () => {
          const tempToken = await handleLogin();
          if (tempToken) {
            fetchFiles('', tempToken);
          }
        }}
        loading={loading}
      />
    );
  }

  return (
    <div className="files-container">
      <Navbar
        creds={creds}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showHidden={showHidden}
        toggleHiddenFiles={toggleHiddenFiles}
        logout={logout}
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
          token={token}
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
