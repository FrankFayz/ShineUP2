import React, { useState } from 'react';
import { FaGraduationCap, FaUsers, FaVideo, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../styles/videoInfo.css';

const VideoInfo = ({ user, title, description, uploadDate }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const maxDescriptionLength = 120; // Characters to show before truncating

  const handleProfileClick = () => {
    console.log("Navigating to user profile:", user.name);
  };

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  // Function to truncate description if needed
  const getTruncatedDescription = () => {
    if (description.length <= maxDescriptionLength || showFullDescription) {
      return description;
    }
    return description.substring(0, maxDescriptionLength) + '...';
  };

  return (
    <div className="video-info-overlay">
      <div className="scrollable-content">
        {/* User Info Section */}
        <div className="user-info-overlay" onClick={handleProfileClick}>
          <img 
            src={user.profilePic} 
            alt={user.name} 
            className="user-avatar-overlay"
          />
          <div className="user-details-overlay">
            <div className="user-name-line-overlay">
              <h3 className="user-name-overlay">{user.name}</h3>
              <span className="user-course-overlay">{user.course}</span>
            </div>
            <div className="user-university-overlay">
              <FaGraduationCap className="icon" />
              <span>{user.university}</span>
            </div>
            <div className="user-stats-overlay">
              <span className="user-stat-overlay">
                <FaUsers /> {user.followers}
              </span>
              <span className="user-stat-overlay">
                <FaVideo /> {user.videos} videos
              </span>
            </div>
          </div>
          <button className="follow-btn-overlay">Follow</button>
        </div>
        
        {/* Video Details Section */}
        <div className="video-details-overlay">
          <h2 className="video-title-overlay">{title}</h2>
          <div className="description-container-overlay">
            <p className="video-description-overlay">
              {getTruncatedDescription()}
              {description.length > maxDescriptionLength && (
                <button 
                  className="more-btn-overlay" 
                  onClick={toggleDescription}
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                  {showFullDescription ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              )}
            </p>
          </div>
          <div className="video-meta-overlay">
            <span className="video-tag-overlay">#MachineLearning</span>
            <span className="video-tag-overlay">#AI</span>
            <span className="video-tag-overlay">#ComputerScience</span>
            <span className="upload-date-overlay">
              Uploaded: {new Date(uploadDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoInfo;