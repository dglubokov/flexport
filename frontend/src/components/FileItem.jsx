// src/components/FileItem.jsx

import React from 'react';
import { humanReadableSize } from '../services/utils';

const FileItem = ({ item, handleItemClick, viewMode }) => {
  const formatPermissions = (permissions, isDir) => {
    // Add file type character
    const fileType = isDir ? 'd' : '-';
  
    // Map numeric permissions to symbolic permissions
    const permissionMap = {
      0: '---',
      1: '--x',
      2: '-w-',
      3: '-wx',
      4: 'r--',
      5: 'r-x',
      6: 'rw-',
      7: 'rwx',
    };
  
    // Convert each numeric digit to symbolic representation
    const symbolicPermissions = permissions
      .split('')
      .map(num => permissionMap[num])
      .join('');
  
    const fullPermissions = fileType + symbolicPermissions;
  
    return (
      <span>
        {fullPermissions.split('').map((char, index) => (
          <span key={index} className={`perm-${char}`}>
            {char}
          </span>
        ))}
      </span>
    );
  };

  const formatDateModified = (unixTimestamp) => {
    const date = new Date(unixTimestamp * 1000); // Convert from seconds to milliseconds
    const options = {
      weekday: 'short', // Mon
      year: 'numeric',  // 2024
      month: 'short',   // May
      day: '2-digit',   // 20
      hour: '2-digit',  // 17
      minute: '2-digit', // 05
      second: '2-digit', // 24
      hour12: false     // 24-hour format
    };
  
    return date.toLocaleString('en-US', options);
  };

  if (viewMode === 'tiles') {
    return (
      <div
        className={`tile ${item.is_dir ? 'directory' : 'file'}`}
        onClick={() => handleItemClick(item)}
      >
        <div className="file-icon">{item.is_dir ? '🗂️' : '📄'}</div>
        <div className="tile-name">{item.name}</div>
        <div className="tile-size">{humanReadableSize(item.size)}</div>
      </div>
    );
  } else {
    return (
      <li
      className={`file-item ${item.is_dir ? 'directory' : 'file'}`}
      onClick={() => handleItemClick(item)}
    >
      <span className="file-permissions">
        {formatPermissions(item.permissions, item.is_dir)}
      </span>
      <span className="file-owner">{item.owner}</span>
      <span className="file-group">{item.group}</span>
      <span className="file-size">{humanReadableSize(item.size)}</span>
      <span className="file-date">{formatDateModified(item.date_modified)}</span>
      <span className="file-name">{item.is_dir ? '🗂️' : '📄'} {item.name}</span>
    </li>
    );
  }
};

export default FileItem;
