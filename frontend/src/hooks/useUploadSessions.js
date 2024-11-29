// src/hooks/useUploadSessions.js

import { useState, useEffect } from 'react';
import { fetchUploadSessions as apiFetchUploadSessions, cancelUploadSession as apiCancelUploadSession, deleteUploadSession as apiDeleteUploadSession } from '../services/api';

const useUploadSessions = (showUploadSessionsPopup) => {
  const [uploadSessions, setUploadSessions] = useState([]);

  const fetchUploadSessions = async () => {
    try {
      const res = await apiFetchUploadSessions();
      if (res.ok) {
        const data = await res.json();
        setUploadSessions(data.sessions);
      } else {
        alert('Error retrieving upload sessions.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching upload sessions.');
    }
  };

  useEffect(() => {
    let interval;
    if (showUploadSessionsPopup) {
      fetchUploadSessions();
      interval = setInterval(fetchUploadSessions, 5000); // Refresh every 5 seconds
    }
    return () => clearInterval(interval);
  }, [showUploadSessionsPopup]);

  const cancelUploadSession = async (sessionId) => {
    try {
      const res = await apiCancelUploadSession(sessionId);
      if (res.ok) {
        alert('Upload session cancelled.');
        fetchUploadSessions();
      } else {
        alert('Error cancelling upload session.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while cancelling upload session.');
    }
  };

  const deleteUploadSession = async (sessionId) => {
    try {
      const res = await apiDeleteUploadSession(sessionId);
      if (res.ok) {
        alert('Upload session deleted.');
        fetchUploadSessions();
      } else {
        alert('Error deleting upload session.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while deleting upload session.');
    }
  };

  return {
    uploadSessions,
    fetchUploadSessions,
    cancelUploadSession,
    deleteUploadSession,
  };
};

export default useUploadSessions;
