// src/components/App.jsx
import React from 'react';
import { useAppContext } from '../context/AppContext';
import LoginForm from './LoginForm';
import Navbar from './Navbar';
import FileList from './FileList';
import ImprovedPathNavigator from './PathNavigator';
import UploadPopup from './UploadPopup/UploadPopup';
import UploadSessionsPopup from './UploadSessionsPopup';
import { humanReadableSize } from '../services/utils';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const {
    credentials,
    isAuthenticated,
    handleAuthInputChange,
    handleLogin,
    handleLogout,
    loading,
    files,
    setFiles,
    currentPath,
    spaceInfo,
    fetchFiles,
    viewMode,
    setViewMode,
    showHidden,
    toggleHiddenFiles,
    showSelection,
    setShowSelection,
    showUploadPopup,
    setShowUploadPopup,
    showUploadSessionsPopup,
    setShowUploadSessionsPopup,
    uploadSessions,
    deleteUploadSession
  } = useAppContext();

  if (!isAuthenticated) {
    return <LoginForm
      credentials={credentials}
      handleChange={handleAuthInputChange}
      handleLogin={handleLogin}
      loading={loading}
    />;
  }

  return (
    <>
      <ToastContainer />
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
          showSelection={showSelection}
          setShowSelection={setShowSelection}
          files={files}
          setFiles={setFiles}
          fetchFiles={fetchFiles}
          currentPath={currentPath}
        />

        {/* Use the improved path navigator */}
        <ImprovedPathNavigator 
          currentPath={currentPath}
          fetchFiles={fetchFiles}
        />

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
            credentials={credentials}
          />
        )}

        {showUploadSessionsPopup && (
          <UploadSessionsPopup
            uploadSessions={uploadSessions}
            deleteUploadSession={deleteUploadSession}
            closePopup={() => setShowUploadSessionsPopup(false)}
          />
        )}

        <FileList
          currentPath={currentPath}
          fetchFiles={fetchFiles}
          files={files}
          setFiles={setFiles}
          goBack={() => {
            if (currentPath) {
              const pathParts = currentPath.split('/');
              pathParts.pop();
              const newPath = pathParts.join('/');
              fetchFiles(newPath);
            }
          }}
          showHidden={showHidden}
          viewMode={viewMode}
          loading={loading}
          showSelection={showSelection}
        />
      </div>
    </>
  );
};

export default App;