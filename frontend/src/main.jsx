// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { AppProvider } from './context/AppContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppProvider>
    <App />
  </AppProvider>
);