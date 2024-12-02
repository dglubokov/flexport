// src/hooks/useUploadSessions.js

import { useState, useEffect } from 'react';
import { fetchUploadSessions as apiFetchUploadSessions, deleteUploadSession as apiDeleteUploadSession } from '../services/api';

const useUploadSessions = ({ showUploadSessionsPopup, credentials }) => {
  const [uploadSessions, setUploadSessions] = useState([]);

  const fetchUploadSessions = async () => {
    try {
      const res = await apiFetchUploadSessions(credentials.username);
      if (res.ok) {
        const data = await res.json();
        const sessions = data.sessions;

        // Sort by started_at_unix
        sessions.sort((a, b) => b.started_at_unix - a.started_at_unix);

        setUploadSessions(sessions);
      } else {
        alert('Error retrieving upload sessions');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching upload sessions');
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

  const deleteUploadSession = async (sessionId) => {
    try {
      const res = await apiDeleteUploadSession(sessionId);
      if (res.ok) {
        alert('Upload session deleted');
        fetchUploadSessions();
      } else {
        alert('Error deleting upload session');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while deleting upload session');
    }
  };

  return {
    uploadSessions,
    deleteUploadSession,
  };
};

export default useUploadSessions;
