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
    if (item.is_dir) {
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      fetchFiles(newPath);
    } else {
      alert(`You clicked on file: ${item.name}`);
    }
  };

  const handleSelection = (item) => {
    item.selected = !item.selected;
    setFiles([...files]);
  };

  if (loading) {
    return <p>Loading...</p>;
  }



  if (viewMode === 'tiles') {
    return (
      <div className="tiles-container">
        {files.map((item, index) => (
          <FileItem
            key={index}
            item={item}
            handleItemClick={handleItemClick}
            viewMode={viewMode}
            showSelection={showSelection}
            handleSelection={handleSelection}
          />
        ))}
      </div>
    );
  } else {
    return (
    <ul className="files-list">
      <div className="file-item directory" onClick={goBack}>
        <span className="name">🔙 ..</span>
      </div>
      {files.map((item, index) =>
        (!item.name.startsWith('.') || showHidden) && (
          <FileItem
            key={index}
            item={item}
            handleItemClick={handleItemClick}
            viewMode={viewMode}
            showSelection={showSelection}
            handleSelection={handleSelection}
          />
        )
      )}
    </ul>
    );
  }
};

export default FileList;
