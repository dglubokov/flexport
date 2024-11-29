// src/components/LoginForm.jsx

import React from 'react';

const LoginForm = ({ credentials, handleChange, handleLogin, loading }) => (
  <div className="login-container">
    <h1>Login to View Your Files</h1>
    <input
      type="text"
      name="username"
      placeholder="Username"
      value={credentials.username}
      onChange={handleChange}
      className="login-input"
    />
    <br />
    <input
      type="password"
      name="password"
      placeholder="Password"
      value={credentials.password}
      onChange={handleChange}
      className="login-input"
    />
    <br />
    <button onClick={handleLogin} disabled={loading} className='fancy-button' title='Login'>
      {loading ? 'Logging in...' : 'Login'}
    </button>
  </div>
);

export default LoginForm;
