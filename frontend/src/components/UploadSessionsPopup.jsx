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
              (session) => showFinishedSessions || session.status !== 'completed'
            )
            .map((session) => (
              <div key={session.session_id} className={`session-item session-${session.status}`}>
                <div className="session-info">
                  <span className="session-type">{session.type}  </span>
                  <span className="session-status">{session.status}</span>
                  <span className="session-details">{session.details}</span>
                </div>
                <div className="session-actions">
                  {session.status !== 'completed' && (
                    <button
                      className="action-button cancel-button"
                      onClick={() => cancelUploadSession(session.id)}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    className="action-button delete-button"
                    onClick={() => deleteUploadSession(session.id)}
                  >
                    Stop
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
      <button
        className="fancy-button cancel-button"
        onClick={closePopup}
      >
        Close
      </button>
    </div>
  </div>
);

export default UploadSessionsPopup;
