// src/hooks/useFileManager.js

import { useState, useEffect } from 'react';
import { fetchFiles as apiFetchFiles, fetchSpaceInfo as apiFetchSpaceInfo } from '../services/api';

const useFileManager = () => {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [spaceInfo, setSpaceInfo] = useState({});

  const fetchFiles = async (path = '') => {
    setLoading(true);
    try {
      const res = await apiFetchFiles(path);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.items);
        setCurrentPath(data.current_path);
        fetchSpaceInfo();
      } else {
        if (res.status === 401) {
          alert('Session expired. Please log in again.');
        } else {
          alert('Error retrieving files.');
        }
      }
    } catch (error) {
      alert('An error occurred while fetching files.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpaceInfo = async () => {
    try {
      const res = await apiFetchSpaceInfo();
      if (res.ok) {
        const data = await res.json();
        setSpaceInfo(data);
      } else {
        alert('Error retrieving space info.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching space info.');
    }
  };

  return {
    files,
    currentPath,
    loading,
    spaceInfo,
    fetchSpaceInfo,
    fetchFiles,
  };
};

export default useFileManager;
