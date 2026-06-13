// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from './pages/mainPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import EmailVerificationPage from './pages/EmailVerificationPage.jsx';
import ShineVault from './components/ShineVault.jsx';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/mainpage" element={<MainPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/vault" element={<ShineVault />} />
      <Route path="/shinevault" element={<ShineVault />} />
      <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
    </Routes>
  );
}
