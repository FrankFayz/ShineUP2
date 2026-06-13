import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/VideoPlayer.css';
import { 
  FaPlay, 
  FaPause, 
  FaHeart, 
  FaShare, 
  FaDownload, 
  FaStickyNote, 
  FaUpload,
  FaUserPlus,
  FaCheck,
  FaVolumeUp,
  FaVolumeMute,
  FaComment,
  FaTimes
} from 'react-icons/fa';

const VideoPlayer = ({ 
  videoUrl, 
  isPlaying, 
  onTogglePlay,
  onVideoClick,
  showOverlay = true 
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1247);
  const [shareCount, setShareCount] = useState(89);
  const [showNotes, setShowNotes] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [comments, setComments] = useState([
    { id: 1, user: 'John Doe', text: 'Amazing video! Love the content!', time: '2 hours ago', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' },
    { id: 2, user: 'Sarah Wilson', text: 'This is exactly what I needed. Thanks!', time: '1 day ago', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face' },
    { id: 3, user: 'Mike Johnson', text: 'Great explanation! Very helpful.', time: '3 days ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' }
  ]);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(comments.length);
  
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const commentInputRef = useRef(null);
  const notesTextareaRef = useRef(null);

  // Define toggleMute early so it can be used in useEffect dependencies
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    setVolume(prev => (prev === 0 ? 1 : 0));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.play().catch(console.error);
      } else {
        video.pause();
      }
    }
  }, [isPlaying]);

  // FIXED: Handle keyboard events specifically for the video player
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check if user is typing in comment input or notes textarea
      const activeElement = document.activeElement;
      const isTypingInInput = 
        activeElement === commentInputRef.current ||
        activeElement === notesTextareaRef.current ||
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable;
      
      // If user is typing in an input field, don't handle video controls
      if (isTypingInInput) {
        return;
      }

      // Handle video controls only when not typing
      if (e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to parent components
        onTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        // Skip backward 10 seconds
        const video = videoRef.current;
        if (video) {
          video.currentTime = Math.max(0, video.currentTime - 10);
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        // Skip forward 10 seconds
        const video = videoRef.current;
        if (video) {
          video.currentTime = Math.min(duration, video.currentTime + 10);
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        e.stopPropagation();
        toggleMute();
      }
    };

    // Add event listener to the video container
    const videoContainer = document.querySelector('.video-player-container');
    if (videoContainer) {
      videoContainer.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      if (videoContainer) {
        videoContainer.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, [onTogglePlay, duration, toggleMute]);

  // FIXED: Handle space bar in input fields - stop propagation
  const handleInputKeyDown = (e) => {
    if (e.code === 'Space') {
      e.stopPropagation(); // Prevent space from triggering video play/pause
    }
  };

  const handleProgressClick = (e) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickTime = (clickX / width) * duration;
    
    video.currentTime = clickTime;
    setCurrentTime(clickTime);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    setShareCount(prev => prev + 1);
    if (navigator.share) {
      navigator.share({ 
        url: videoUrl, 
        title: 'Check out this video!' 
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(videoUrl);
      alert('Video URL copied to clipboard!');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = 'video.mp4';
    link.click();
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim() === '') return;

    const comment = {
      id: comments.length + 1,
      user: 'You', // In real app, this would be the actual user
      text: newComment,
      time: 'Just now',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
    };

    setComments([comment, ...comments]);
    setCommentCount(prev => prev + 1);
    setNewComment('');
    
    // Focus back to input after adding comment
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  // FIXED: Handle notes functionality
  const [noteText, setNoteText] = useState('');
  
  const handleSaveNote = () => {
    if (noteText.trim()) {
      // In a real app, you would save the note to a backend
      alert('Note saved!');
      setNoteText('');
      setShowNotes(false);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleVideoClick = (e) => {
    e.stopPropagation();
    if (onVideoClick) {
      onVideoClick();
    } else {
      onTogglePlay();
    }
  };

  return (
    <div 
      className="video-player-container"
      tabIndex="0" // Make the container focusable for keyboard events
    >
      <div 
        className="video-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleVideoClick}
      >
        <video 
          ref={videoRef}
          className="video-player"
          controls={false}
          autoPlay={isPlaying}
          muted={isMuted}
          loop
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {showOverlay && (
          <div className={`video-overlay ${isHovered ? 'hovered' : ''}`}>
            <button className="play-pause-btn" onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
          </div>
        )}

        {/* Progress Bar */}
        <div 
          className="video-progress-container"
          onClick={(e) => {
            e.stopPropagation();
            handleProgressClick(e);
          }}
          ref={progressBarRef}
        >
          <div className="video-progress-background"></div>
          <div 
            className="video-progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
          <div 
            className="video-progress-thumb"
            style={{ left: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Time Display - Hidden */}

        {/* Volume Control */}
        <div className="volume-control">
          <button className="volume-btn" onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}>
            {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              e.stopPropagation();
              handleVolumeChange(e);
            }}
            className="volume-slider"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Sidebar Controls - Vertical Buttons - TikTok Style */}
        <div className="video-sidebar-controls">
          <div className="sidebar-buttons-vertical">
            {/* Like Button */}
            <button 
              className={`sidebar-btn like-btn ${isLiked ? 'liked' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              onMouseEnter={() => setHoveredButton('like')}
              onMouseLeave={() => setHoveredButton(null)}
              title="Like this video"
              aria-label={`Like button with ${likeCount} likes`}
            >
              <FaHeart />
              <span className="btn-label">{hoveredButton === 'like' ? 'Like' : likeCount}</span>
            </button>
            
            {/* Comment Button */}
            <button 
              className={`sidebar-btn comment-btn ${showComments ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
                setShowNotes(false);
              }}
              onMouseEnter={() => setHoveredButton('comment')}
              onMouseLeave={() => setHoveredButton(null)}
              title="View and post comments"
              aria-label={`Comment button with ${commentCount} comments`}
            >
              <FaComment />
              <span className="btn-label">{hoveredButton === 'comment' ? 'Comment' : commentCount}</span>
            </button>
            
            {/* Share Button */}
            <button 
              className="sidebar-btn share-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              onMouseEnter={() => setHoveredButton('share')}
              onMouseLeave={() => setHoveredButton(null)}
              title="Share this video"
              aria-label={`Share button with ${shareCount} shares`}
            >
              <FaShare />
              <span className="btn-label">{hoveredButton === 'share' ? 'Share' : shareCount}</span>
            </button>
            
            {/* Download Button */}
            <button 
              className="sidebar-btn download-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              onMouseEnter={() => setHoveredButton('download')}
              onMouseLeave={() => setHoveredButton(null)}
              title="Download this video"
              aria-label="Download button"
            >
              <FaDownload />
              <span className="btn-label">Save</span>
            </button>
            
            {/* Notes Button */}
            <button 
              className={`sidebar-btn notes-btn ${showNotes ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowNotes(!showNotes);
                setShowComments(false);
              }}
              onMouseEnter={() => setHoveredButton('notes')}
              onMouseLeave={() => setHoveredButton(null)}
              title="Take notes on this video"
              aria-label="Notes button"
            >
              <FaStickyNote />
              <span className="btn-label">Notes</span>
            </button>
          </div>
        </div>

        {/* Comments Panel */}
        {showComments && (
          <div className="comments-panel" onClick={(e) => e.stopPropagation()}>
            <div className="comments-header">
              <h3>Comments ({commentCount})</h3>
              <button 
                className="close-comments-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments(false);
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">
                    <img src={comment.avatar} alt={comment.user} />
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-user">{comment.user}</span>
                      <span className="comment-time">{comment.time}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <form className="comment-form" onSubmit={handleAddComment}>
              <div className="comment-input-container">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleInputKeyDown} // FIXED: Prevent space bar propagation
                  className="comment-input"
                />
                <button 
                  type="submit" 
                  className="comment-submit-btn"
                  disabled={!newComment.trim()}
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes Panel */}
        {showNotes && (
          <div className="notes-panel" onClick={(e) => e.stopPropagation()}>
            <div className="notes-header">
              <h3>Video Notes</h3>
              <button onClick={(e) => {
                e.stopPropagation();
                setShowNotes(false);
              }}>×</button>
            </div>
            <div className="notes-content">
              <p>Add your notes about this video here...</p>
              <textarea 
                ref={notesTextareaRef}
                placeholder="Type your notes..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={handleInputKeyDown} // FIXED: Prevent space bar propagation
              ></textarea>
              <button 
                className="save-notes-btn"
                onClick={handleSaveNote}
              >
                Save Notes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;