// src/components/Header.jsx
import React, { useEffect, useState } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar.jsx';
import '../styles/header.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const readCachedUser = () => {
  try {
    const cachedUser = localStorage.getItem('currentUser');
    return cachedUser ? JSON.parse(cachedUser) : null;
  } catch (error) {
    return null;
  }
};

const mergeLocalProfilePic = (user) => {
  const cachedUser = readCachedUser();
  if (cachedUser?.id && String(cachedUser.id) === String(user?.id) && cachedUser.local_profile_pic) {
    return { ...user, local_profile_pic: cachedUser.local_profile_pic };
  }
  return user;
};

const Header = ({ onUploadClick, onSearch, user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user || readCachedUser());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      setCurrentUser(mergeLocalProfilePic(user));
    }
  }, [user]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem('authToken');
      if (!token || user) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/profile/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const userForUi = mergeLocalProfilePic(data.user);
        setCurrentUser(userForUi);
        localStorage.setItem('currentUser', JSON.stringify(userForUi));
      } catch (error) {
        const cachedUser = readCachedUser();
        if (cachedUser) {
          setCurrentUser(cachedUser);
        }
      }
    };

    loadCurrentUser();

    const handleProfileUpdated = (event) => {
      if (event.detail?.user) {
        setCurrentUser(event.detail.user);
        localStorage.setItem('currentUser', JSON.stringify(event.detail.user));
      } else {
        loadCurrentUser();
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('profile-updated', handleProfileUpdated);
  }, [user]);

  const profilePic = currentUser?.local_profile_pic || currentUser?.profile_pic;
  const displayName = currentUser?.username || 'User Profile';
  const profileStatus = currentUser?.university
    ? currentUser.course
      ? `${currentUser.university} - ${currentUser.course}`
      : currentUser.university
    : 'View and edit account';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation handlers
  const handleShineVaultClick = () => {
    navigate('/shinevault');
    setIsMenuOpen(false);
  };

  const handleHomeClick = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsMenuOpen(false);
  };

  // For menu items that don't have routes yet - prevent default and show message
  const handleComingSoon = (label) => {
    return (e) => {
      e.preventDefault();
      alert(`${label} feature is coming soon!`);
      setIsMenuOpen(false);
    };
  };

  const menuItems = [
    { 
      icon: <FaHome />, 
      label: 'Home', 
      onClick: handleHomeClick,
      active: location.pathname === '/'
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
      active: location.pathname === '/shinevault'
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
                  <img src="/logos.svg" alt="ShineUP Logo" className="logo-img" />
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
              {/* Notification Bell */}
              <button className="icon-btn notification-btn" title="Notifications">
                <FaBell />
                <span className="notification-badge">3</span>
              </button>

              <button
                className="icon-btn header-profile-btn"
                onClick={handleProfileClick}
                title="Profile"
                aria-label="Open profile"
              >
                {profilePic ? (
                  <img src={profilePic} alt={displayName} className="header-profile-img" />
                ) : (
                  <FaUserCircle />
                )}
              </button>
              
              {/* Hamburger Menu */}
              <button 
                className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`} 
                onClick={toggleMenu} 
                title="Menu" 
                aria-label="Toggle menu"
              >
                <span className="hamburger-line line-1"></span>
                <span className="hamburger-line line-2"></span>
                <span className="hamburger-line line-3"></span>
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
            {/* User Profile Section */}
            <div
              className="menu-profile-section menu-profile-button"
              role="button"
              tabIndex={0}
              onClick={handleProfileClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleProfileClick();
                }
              }}
            >
              <div className="profile-avatar">
                {profilePic ? (
                  <img src={profilePic} alt={displayName} className="profile-avatar-img" />
                ) : (
                  <FaUserCircle className="profile-circle-icon" />
                )}
              </div>
              <div className="profile-info">
                <h3 className="profile-name">{displayName}</h3>
                <p className="profile-status">{profileStatus}</p>
              </div>
              <button
                className="close-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu();
                }}
              >
                <FaTimes />
              </button>
            </div>

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
