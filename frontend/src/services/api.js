// src/services/api.js

const API_BASE_URL = 'http://lifespan:8009';

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

export const handleDownload = async (path) => {
  const formData = new FormData();
  formData.append('path', path);
  const res = await fetch(`${API_BASE_URL}/direct_download`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return res;
}

export const handleDelete = async (path, file_name) => {
  const formData = new FormData();
  formData.append('path', path);
  const res = await fetch(`${API_BASE_URL}/delete_file`, {
    method: 'DELETE',
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


export const handleLinksUpload = async (links, path) => {
  const res = await fetch(`${API_BASE_URL}/links_upload`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ links, path }),
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

export const deleteUploadSession = async (sessionId) => {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res;
}

