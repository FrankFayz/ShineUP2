import React from 'react';
import '../styles/videoInfoSidebar.css';

const MobileVideoControls = ({ currentTime, duration, progress }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="mobile-video-controls mobile-controls-simplified">
      <div className="mobile-progress-container">
        <div className="mobile-progress-bar">
          <div 
            className="mobile-progress-filled" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {/* Time display removed */}
      </div>
    </div>
  );
};

export default MobileVideoControls;