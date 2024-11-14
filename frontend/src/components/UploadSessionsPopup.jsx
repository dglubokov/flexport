// src/components/UploadSessionsPopup.jsx

import React from 'react';

const UploadSessionsPopup = ({
  uploadSessions,
  cancelUploadSession,
  deleteUploadSession,
  showFinishedSessions,
  setShowFinishedSessions,
  closePopup,
}) => (
  <div className="modal-overlay">
    <div className="upload-sessions-popup">
      <h2>Upload Sessions</h2>
      <label>
        <input
          type="checkbox"
          checked={showFinishedSessions}
          onChange={() => setShowFinishedSessions(!showFinishedSessions)}
        />
        Show Finished Sessions
      </label>
      <div className="upload-sessions-list">
        {uploadSessions.length === 0 ? (
          <p>No upload sessions.</p>
        ) : (
          uploadSessions
            .filter(
              (session) => showFinishedSessions || session.status !== 'finished'
            )
            .map((session) => (
              <div key={session.id} className={`session-item ${session.status}`}>
                <span>{session.name}</span>
                <span>Status: {session.status}</span>
                <div className="session-actions">
                  {session.status !== 'finished' && (
                    <button onClick={() => cancelUploadSession(session.id)}>
                      Cancel
                    </button>
                  )}
                  <button onClick={() => deleteUploadSession(session.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
      <button onClick={closePopup}>Close</button>
    </div>
  </div>
);

export default UploadSessionsPopup;
