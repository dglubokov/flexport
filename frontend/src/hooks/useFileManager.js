// src/hooks/useFileManager.js

import { useState, useEffect } from 'react';
import { fetchFiles as apiFetchFiles, fetchSpaceInfo as apiFetchSpaceInfo } from '../services/api';

const useFileManager = (initialToken) => {
  const [token, setToken] = useState(initialToken);
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [spaceInfo, setSpaceInfo] = useState({});

  useEffect(() => {
    setToken(initialToken);
  }, [initialToken]);

  const fetchFiles = async (path = '', token) => {
    setLoading(true);
    try {
      const res = await apiFetchFiles(path, token);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.items);
        setCurrentPath(data.current_path);
        fetchSpaceInfo(token);
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

  const fetchSpaceInfo = async (token) => {
    try {
      const res = await apiFetchSpaceInfo(token);
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
    fetchFiles,
  };
};

export default useFileManager;
