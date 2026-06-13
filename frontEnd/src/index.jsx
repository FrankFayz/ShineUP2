
import AuthPage from './pages/AuthPage.jsx';



// src/index.js
import App from './App'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Apps from './App.js';  // Make sure this imports App.js
import ShineVault from './components/ShineVault.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);