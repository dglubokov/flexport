// src/services/api.js

const API_BASE_URL = 'http://localhost:8000';

export const login = async (credentials) => {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return res;
};

export const logout = async () => {
  const res = await fetch(`${API_BASE_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return res;
}

export const checkAuth = async () => {
  const res = await fetch(`${API_BASE_URL}/check_token`, {
    method: 'GET',
    credentials: 'include',
  });
  return res;
}

export const fetchFiles = async (path) => {
  const res = await fetch(
    `${API_BASE_URL}/list_files?path=${encodeURIComponent(path)}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );
  return res;
};

export const downloadFile = async (path) => {
  const res = await fetch(
    `${API_BASE_URL}/download_file?path=${encodeURIComponent(path)}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );
  return res;
}

export const fetchSpaceInfo = async () => {
  const res = await fetch(`${API_BASE_URL}/space_info`, {
    method: 'GET',
    credentials: 'include',
  });
  return res;
}



export const handleDirectUpload = async (path, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('current_path', path);
  const res = await fetch(`${API_BASE_URL}/direct_upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return res;
}


export const fetchFTPFiles = async (ftpData) => {
  const res = await fetch(`${API_BASE_URL}/ftp/list-files`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify(ftpData),
  });
  return res;
}

export const downloadFTPFile = async (ftpData) => {
  const res = await fetch(`${API_BASE_URL}/ftp/download`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify(ftpData),
  });
  return res;
}


export const fetchSFTPFiles = async (ftpData) => {
  const res = await fetch(`${API_BASE_URL}/sftp/list-files`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify(ftpData),
  });
  return res;
}

export const downloadSFTPFile = async (ftpData) => {
  const res = await fetch(`${API_BASE_URL}/sftp/download`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify(ftpData),
  });
  return res;
}


export const handleLinksUpload = async (links) => {
  const res = await fetch(`${API_BASE_URL}/links_upload`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify({ links }),
  });
  return res;
}


export const fetchUploadSessions = async (username) => {
  const res = await fetch(`${API_BASE_URL}/sessions/${username}`, {
    method: 'GET',
    credentials: 'include',
  });
  return res;
}

export const cancelUploadSession = async (sessionId) => {
  console.log('Cancelling session', sessionId);
}

export const deleteUploadSession = async (sessionId) => {
  console.log('Deleting session', sessionId);
}
