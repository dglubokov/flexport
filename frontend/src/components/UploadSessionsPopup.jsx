// src/components/UploadSessionsPopup.jsx

import React, { useState } from 'react';

const UploadSessionsPopup = ({
  uploadSessions,
  setUploadSessions,
  cancelUploadSession,
  deleteUploadSession,
  closePopup,
}) => {
  const [showFinishedSessions, setShowFinishedSessions] = useState(false);

  const handleSelectionDetails = (session) => {
    setUploadSessions(
      uploadSessions.map((s) =>
        s.session_id === session.session_id
          ? { ...s, selected: !s.selected }
          : s
      )
    );
  }
  

  return (
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
              (session) => showFinishedSessions || session.status !== 'Completed'
            )
            .map((session) => (
              <div key={session.session_id}>
              {session.selected && (
                <div className="session-details">
                  <p><b>Session ID:</b> <br/> {session.session_id}</p>
                  <p><b>File Name:</b> <br/> {session.file_name}</p>
                  <p><b>Upload Path:</b> <br/> {session.uploaded_at}</p>
                  <p
                    style={session.status ? { display: 'none' } : {}}
                  >
                    <b>Completed At:</b> <br/> {session.completed_at}
                  </p>
                  <p><b>Status:</b> {session.status}</p>
                  <p
                    style={session.status ? { display: 'none' } : {}}
                  >
                    <b>Details:</b> <br/> {session.details}
                  </p>
                  <div className="session-progress-container" style={session.progress == 100 ? { display: 'none' } : {}}>
                    <div
                      className="session-progress-bar"
                      style={{ width: `${session.progress}%` }}
                    >
                      <div className="session-progress-text">{session.progress}%</div>
                    </div>
                  </div>
                  <button
                    className="fancy-button cancel-button"
                    onClick={() => handleSelectionDetails(session)}
                  >
                    Close
                  </button>
                </div>
              )}
              <div key={session.session_id} className={`session-item session-${session.status.toLowerCase()}`}>
                <div className="session-info">
                  <span className="session-type">{session.type}  </span>
                  <span className="session-status">{session.status}</span>
                  <button className="session-details-button" onClick={() => handleSelectionDetails(session)}>
                    Details
                  </button>
                </div>
                <div className="session-actions">
                  {session.status !== 'completed' && (
                    <button
                      className="remove-file-button"
                      onClick={() => cancelUploadSession(session.id)}
                    >
                      x
                    </button>
                  )}
                </div>
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
};

export default UploadSessionsPopup;
