// src/components/Header.jsx
import React, { useState } from 'react';
import { 
  FaBars, 
  FaBell, 
  FaUserCircle, 
  FaHome, 
  FaCompass, 
  FaBook, 
  FaBriefcase,
  FaDownload,
  FaHistory,
  FaCog,
  FaFire,
  FaUserPlus,
  FaTimes,
  FaUpload,
  FaGraduationCap,
  FaGem
} from 'react-icons/fa';
import SearchBar from './SearchBar.jsx';
import '../styles/header.css';

const Header = ({ onUploadClick, onSearch }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation handlers
  const handleShineVaultClick = () => {
    // Use window.location for navigation to avoid hook issues
    window.location.href = '/shinevault';
    setIsMenuOpen(false);
  };

  const handleHomeClick = () => {
    window.location.href = '/';
    setIsMenuOpen(false);
  };

  // For menu items that don't have routes yet
  const handleComingSoon = (label) => {
    return () => {
      alert(`${label} feature is coming soon!`);
      setIsMenuOpen(false);
    };
  };

  // Get current path for active state
  const currentPath = window.location.pathname;

  const menuItems = [
    { 
      icon: <FaHome />, 
      label: 'Home', 
      onClick: handleHomeClick,
      active: currentPath === '/'
    },
    { 
      icon: <FaCompass />, 
      label: 'Explore', 
      onClick: handleComingSoon('Explore')
    },
    { 
      icon: <FaBook />, 
      label: 'Library', 
      onClick: handleComingSoon('Library')
    },
    { 
      icon: <FaBriefcase />, 
      label: 'Career', 
      onClick: handleComingSoon('Career')
    },
    { 
      icon: <FaGem />, 
      label: 'ShineVault', 
      onClick: handleShineVaultClick,
      active: currentPath === '/shinevault'
    },
    { 
      icon: <FaDownload />, 
      label: 'Downloads', 
      onClick: handleComingSoon('Downloads')
    },
    { 
      icon: <FaHistory />, 
      label: 'Recently Searched', 
      onClick: handleComingSoon('Recently Searched')
    },
    { 
      icon: <FaFire />, 
      label: 'Popular', 
      onClick: handleComingSoon('Popular')
    },
    { 
      icon: <FaCog />, 
      label: 'Settings', 
      onClick: handleComingSoon('Settings')
    },
    { 
      icon: <FaUserPlus />, 
      label: 'Create Portfolio', 
      onClick: handleComingSoon('Create Portfolio')
    }
  ];

  return (
    <>
      <header className="header">
        <div className="header-background"></div>
        
        <div className="header-content">
          {/* Main Row - Everything stays here on PC, search moves down on mobile */}
          <div className="header-main-row">
            {/* Left Section - Logo */}
            <div className="header-left">
              <div className="logo-container">
                <div className="logo-circle">
                  <span className="logo-text">🌟</span>
                </div>
                <div className="app-title-container">
                  <h1 className="app-title">SHINE</h1>
                  <span className="up-text">UP</span>
                </div>
              </div>
            </div>

            {/* Center Section - Search (Hidden on mobile in this row) */}
            <div className="header-center">
              <SearchBar onSearch={onSearch} />
            </div>

            {/* Right Section - Actions */}
            <div className="header-right">
              <button className="upload-btn-header" onClick={onUploadClick}>
                <FaGraduationCap className="upload-icon" />
                <span className="upload-text">Upload Video</span>
              </button>

              <button className="icon-btn">
                <FaBell />
                <span className="notification-badge">3</span>
              </button>
              
              <button className="icon-btn">
                <FaUserCircle />
              </button>
              
              <button className="hamburger-btn" onClick={toggleMenu}>
                <span className="hamburger-dashes">☰</span>
              </button>
            </div>
          </div>

          {/* Mobile Search Row - Only visible on mobile */}
          <div className="header-mobile-search">
            <SearchBar onSearch={onSearch} />
          </div>
        </div>
      </header>

      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <div className="menu-overlay" onClick={toggleMenu}>
          <div className="menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <div className="menu-logo">
                <div className="menu-logo-circle">
                  <span>🌟</span>
                </div>
                <div className="menu-title">
                  <span>SHINE</span>
                  <span className="menu-up-text">UP</span>
                </div>
              </div>
              <button className="close-menu-btn" onClick={toggleMenu}>
                <FaTimes />
              </button>
            </div>
            <div className="menu-items">
              {menuItems.map((item, index) => (
                <button 
                  key={index}
                  className={`menu-item ${item.active ? 'active' : ''}`}
                  onClick={item.onClick}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                  {item.active && <span className="active-indicator">•</span>}
                </button>
              ))}
            </div>
            <div className="menu-footer">
              <p>Where brilliance meets opportunity</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;