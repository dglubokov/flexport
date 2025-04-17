// src/components/FileList.jsx

import React from 'react';
import FileItem from './FileItem';

const FileList = ({
  currentPath,
  fetchFiles,
  files,
  setFiles,
  goBack,
  showHidden,
  viewMode,
  loading,
  showSelection,
}) => {
  const handleItemClick = (item) => {
    // Only navigate to directories if not in selection mode
    if (item.is_dir && !showSelection) {
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      fetchFiles(newPath);
    } else if (showSelection && !item.is_dir) {
      // Toggle selection when in selection mode and item is a file
      handleSelection(item);
    } else if (!showSelection && !item.is_dir) {
      // When not in selection mode and clicking a file, show file info or preview
      alert(`You clicked on file: ${item.name}`);
    }
  };

  const handleSelection = (item) => {
    // Only allow selection of files, not directories
    if (item.is_dir) return;
    
    // Toggle the selected state for the item
    const updatedFiles = files.map(file => {
      if (file.path === item.path) {
        return { ...file, selected: !file.selected };
      }
      return file;
    });
    
    setFiles(updatedFiles);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading files...</p>
      </div>
    );
  }

  // Filter files based on showHidden flag
  const filteredFiles = files.filter(item => showHidden || !item.name.startsWith('.'));

  if (viewMode === 'tiles') {
    return (
      <div className="tiles-container">
        {/* Back button as a tile */}
        <div className="tile directory" onClick={goBack}>
          <div className="file-icon">🔙</div>
          <div className="tile-name">Go Back</div>
        </div>
        
        {/* File and directory tiles */}
        {filteredFiles.map((item, index) => (
          <FileItem
            key={index}
            item={item}
            handleItemClick={handleItemClick}
            viewMode={viewMode}
            showSelection={showSelection}
            handleSelection={() => handleSelection(item)}
          />
        ))}
      </div>
    );
  } else {
    return (
      <ul className="files-list">
        {/* Back button */}
        <div className="file-row">
          <li className="file-item directory" onClick={goBack}>
            <span className="file-name">🔙 ..</span>
          </li>
        </div>
        
        {/* Files and directories */}
        {filteredFiles.map((item, index) => (
          <FileItem
            key={index}
            item={item}
            handleItemClick={handleItemClick}
            viewMode={viewMode}
            showSelection={showSelection}
            handleSelection={() => handleSelection(item)}
          />
        ))}
      </ul>
    );
  }
};

export default FileList;