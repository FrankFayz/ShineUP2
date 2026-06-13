// src/App.js
import React from 'react';
import MainPage from './components/MainPage';
import ShineVault from './components/ShineVault';
import './styles/mainPage.css';
import './styles/shineVault.css';

function App() {
  // Get current path from URL
  const currentPath = window.location.pathname;
  
  console.log('Current path:', currentPath); // Debug log
  
  // Simple routing - if path is /shinevault, show ShineVault, else show MainPage
  if (currentPath === '/shinevault') {
    return <ShineVault />;
  }
  
  // Default to MainPage
  return <MainPage />;
}

export default App;