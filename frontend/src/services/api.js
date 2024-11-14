// src/services/api.js

const API_BASE_URL = 'http://localhost:8000';

export const login = async (creds) => {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  return res;
};

export const fetchFiles = async (path, token) => {
  const res = await fetch(
    `${API_BASE_URL}/list_files?path=${encodeURIComponent(path)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res;
};

export const downloadFile = async (path, token) => {
  const res = await fetch(
    `${API_BASE_URL}/download_file?path=${encodeURIComponent(path)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res;
}

export const fetchSpaceInfo = async (token) => {
  const res = await fetch(`${API_BASE_URL}/space_info`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
}


export const fetchUploadSessions = async (token) => {
  const res = await fetch(`${API_BASE_URL}/list_upload_sessions`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
}


export const cancelUploadSession = async (sessionId, token) => {
  const res = await fetch(`${API_BASE_URL}/cancel_upload_session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return res;
}


export const deleteUploadSession = async (sessionId, token) => {
  const res = await fetch(`${API_BASE_URL}/delete_upload_session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return res;
}


export const handleDirectUpload = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/direct_upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res;
}


export const handleFtpUpload = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/ftp_upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res;
}


export const handleLinksUpload = async (links, token) => {
  const res = await fetch(`${API_BASE_URL}/links_upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ links }),
  });
  return res;
}

