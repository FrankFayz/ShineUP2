import React, { useState } from 'react';
import { FaHome, FaComments, FaUpload, FaUser } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/BottomNav.css';

const BottomNav = ({ onUploadClick, isFollowing }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');

  const handleNavigation = (tab, path) => {
    setActiveTab(tab);
    if (path) {
      navigate(path);
    }
  };

  const isActive = (tab) => activeTab === tab || 
    (tab === 'home' && location.pathname === '/') ||
    (tab === 'messages' && location.pathname === '/messages') ||
    (tab === 'profile' && location.pathname === '/profile');

  return (
    <div className="bottom-nav-container">
      <button 
        className={`nav-btn nav-home ${isActive('home') ? 'active' : ''}`}
        onClick={() => handleNavigation('home', '/')}
        title="Home"
      >
        <FaHome className="nav-icon" />
        <span className="nav-label">Home</span>
      </button>

      <button 
        className={`nav-btn nav-messages ${isActive('messages') ? 'active' : ''}`}
        onClick={() => handleNavigation('messages', '/messages')}
        title="Messages"
      >
        <FaComments className="nav-icon" />
        <span className="nav-label">Messages</span>
      </button>

      <button 
        className="nav-btn nav-upload"
        onClick={onUploadClick}
        title="Upload"
      >
        <FaUpload className="nav-icon" />
        <span className="nav-label">Upload</span>
      </button>

      <button 
        className={`nav-btn nav-profile ${isActive('profile') ? 'active' : ''}`}
        onClick={() => handleNavigation('profile', '/profile')}
        title="Profile"
      >
        <FaUser className="nav-icon" />
        <span className="nav-label">Profile</span>
      </button>
    </div>
  );
};

export default BottomNav;
