// src/components/FileList.jsx

import React from 'react';
import FileItem from './FileItem';

const FileList = ({
  files,
  handleItemClick,
  goBack,
  showHidden,
  viewMode,
  loading,
}) => {
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
          />
        )
      )}
    </ul>
    );
  }
};

export default FileList;
