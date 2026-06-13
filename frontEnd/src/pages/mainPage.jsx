import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import VideoInfoSidebar from '../components/VideoInfoSidebar.jsx';
import MobileVideoControls from '../components/MobileVideoControls.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { FaCheck, FaTimes } from 'react-icons/fa';
import '../styles/mainPage.css';

// Throttle utility function - moved outside component
const useThrottle = (callback, delay) => {
  const lastCall = useRef(0);
  
  return useCallback((...args) => {
    const now = new Date().getTime();
    if (now - lastCall.current < delay) return;
    lastCall.current = now;
    return callback(...args);
  }, [callback, delay]);
};

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const readCachedJson = (key, fallback = null) => {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeCachedJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const mergeLocalProfilePic = (user) => {
  const cachedUser = readCachedJson('currentUser');
  if (cachedUser?.id && String(cachedUser.id) === String(user?.id) && cachedUser.local_profile_pic) {
    return { ...user, local_profile_pic: cachedUser.local_profile_pic };
  }
  return user;
};

const formatFeedVideo = (video) => ({
  ...video,
  videoUrl: video.video_url || video.videoUrl,
  thumbnailUrl: video.thumbnail_url || video.thumbnailUrl,
  likeCount: video.like_count || 0,
  commentCount: video.comment_count || 0,
  shareCount: video.share_count || 0,
  viewCount: video.view_count || 0,
  uploadDate: video.created_at || video.uploadDate,
  views: video.view_count || video.views || 0,
  user: {
    id: video.user_id || video.user?.id,
    name: video.username || video.user?.name || 'Anonymous',
    profilePic: video.profile_pic || video.user?.profilePic || '',
    university: video.university || video.user?.university || '',
    followers: video.user?.followers || 0,
    videos: video.user?.videos || 0,
  },
});

const applyUserProfileToVideos = (videosList, user) => {
  if (!user?.id) {
    return videosList;
  }

  return videosList.map(video => {
    const videoUserId = video.user?.id || video.user_id;
    if (String(videoUserId) !== String(user.id)) {
      return video;
    }

    const profilePic = user.local_profile_pic || user.profile_pic || video.user?.profilePic || '';

    return {
      ...video,
      username: user.username || video.username,
      profile_pic: user.profile_pic || video.profile_pic,
      university: user.university || video.university,
      user: {
        ...(video.user || {}),
        id: user.id,
        name: user.username || video.user?.name || 'You',
        profilePic,
        university: user.university || video.user?.university || '',
      },
    };
  });
};

const MainPage = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCancellingUpload, setIsCancellingUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [pendingUploadedVideo, setPendingUploadedVideo] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVideoInfoExpanded, setIsVideoInfoExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => readCachedJson('currentUser'));
  
  // Individual video states
  const [videoStates, setVideoStates] = useState({});
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    topics: [{ title: '', content: '' }]
  });
  
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploadRequestRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/auth', { replace: true });
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-session/`, {
          headers: { Authorization: `Token ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem('authToken');
          navigate('/auth', { replace: true });
          return;
        }

        const data = await response.json();
        const userForUi = mergeLocalProfilePic(data.user);
        setCurrentUser(userForUi);
        writeCachedJson('currentUser', userForUi);
        setIsCheckingSession(false);
      } catch (error) {
        const cachedUser = readCachedJson('currentUser');
        if (cachedUser) {
          setCurrentUser(cachedUser);
          setIsCheckingSession(false);
          return;
        }
        localStorage.removeItem('authToken');
        navigate('/auth', { replace: true });
      }
    };

    verifySession();
  }, [navigate]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch videos from Django backend on component mount
  useEffect(() => {
    if (isCheckingSession) {
      return;
    }

    fetchVideos();
  }, [isCheckingSession, currentUser?.profile_pic]);

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      const updatedUser = event.detail?.user || readCachedJson('currentUser');
      if (!updatedUser) {
        return;
      }

      setCurrentUser(updatedUser);
      setVideos(prev => {
        const updatedVideos = applyUserProfileToVideos(prev, updatedUser);
        writeCachedJson('cachedVideos', updatedVideos);
        return updatedVideos;
      });
      setFilteredVideos(prev => applyUserProfileToVideos(prev, updatedUser));
    };

    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('profile-updated', handleProfileUpdated);
  }, []);

  // Backend API call to fetch videos - optimized feed endpoint
  const fetchVideos = async () => {
    try {
      // Use optimized feed endpoint for TikTok-like infinite scrolling
      const response = await fetch(`${API_BASE_URL}/videos/feed/?limit=15&offset=0`);
      if (response.ok) {
        const videosData = await response.json();
        // Handle paginated response - extract results array
        const videosList = videosData.results ? videosData.results : videosData;
        // Transform API data to match frontend expectations
        const formattedVideos = applyUserProfileToVideos(
          videosList.map(formatFeedVideo),
          currentUser || readCachedJson('currentUser'),
        );
        setVideos(formattedVideos);
        setFilteredVideos(formattedVideos);
        writeCachedJson('cachedVideos', formattedVideos);
      } else {
        console.error('Failed to fetch videos');
        const cachedVideos = readCachedJson('cachedVideos');
        const fallbackVideos = cachedVideos || sampleVideos;
        setVideos(fallbackVideos);
        setFilteredVideos(fallbackVideos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      const cachedVideos = readCachedJson('cachedVideos');
      const fallbackVideos = cachedVideos || sampleVideos;
      setVideos(fallbackVideos);
      setFilteredVideos(fallbackVideos);
    }
  };

  // Initialize video states when videos change
  useEffect(() => {
    const initialVideoStates = videos.reduce((acc, video) => ({
      ...acc,
      [video.id]: { 
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        progress: 0
      }
    }), {});
    setVideoStates(initialVideoStates);
  }, [videos]);

  const currentVideo = filteredVideos[currentVideoIndex] || (videos[0] || null);
  const currentVideoState = videoStates[currentVideo?.id] || {};

  // Video upload functionality
  const handleUploadClick = () => {
    if (!localStorage.getItem('authToken')) {
      navigate('/auth');
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      alert('File size must be less than 500MB');
      return;
    }

    setSelectedFile(file);
    setShowUploadForm(true);
    setUploadFormData({
      title: file.name.replace(/\.[^/.]+$/, ""),
      description: '',
      topics: [{ title: '', content: '' }]
    });
  };

  // Handle form input changes
  const handleFormChange = useCallback((field, value) => {
    setUploadFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle topic changes
  const handleTopicChange = useCallback((index, field, value) => {
    const updatedTopics = [...uploadFormData.topics];
    updatedTopics[index][field] = value;
    setUploadFormData(prev => ({
      ...prev,
      topics: updatedTopics
    }));
  }, [uploadFormData.topics]);

  // Add new topic field
  const addTopic = useCallback(() => {
    setUploadFormData(prev => ({
      ...prev,
      topics: [...prev.topics, { title: '', content: '' }]
    }));
  }, []);

  // Remove topic field
  const removeTopic = useCallback((index) => {
    if (uploadFormData.topics.length > 1) {
      const updatedTopics = uploadFormData.topics.filter((_, i) => i !== index);
      setUploadFormData(prev => ({
        ...prev,
        topics: updatedTopics
      }));
    }
  }, [uploadFormData.topics.length]);

  const getUploadErrorMessage = (xhr, fallback) => {
    try {
      const data = JSON.parse(xhr.responseText);
      return data.detail || Object.values(data).flat().join(', ') || fallback;
    } catch (error) {
      return fallback;
    }
  };

  const saveUploadedVideoMetadata = useCallback(async (cloudinaryUpload, formData, token) => {
    const response = await fetch(`${API_BASE_URL}/videos/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title.trim(),
        description: formData.description.trim(),
        video_url: cloudinaryUpload.secure_url,
        cloudinary_public_id: cloudinaryUpload.public_id,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(Object.values(data).flat().join(', ') || 'Video metadata could not be saved.');
    }
    return data;
  }, []);

  const uploadDirectlyToCloudinary = useCallback(async (file, token) => {
    const signatureResponse = await fetch(`${API_BASE_URL}/videos/upload-signature/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
    });
    const signatureData = await signatureResponse.json();
    if (!signatureResponse.ok) {
      throw new Error(signatureData.detail || 'Could not prepare the direct upload.');
    }

    const cloudinaryData = new FormData();
    cloudinaryData.append('file', file);
    cloudinaryData.append('api_key', signatureData.api_key);
    cloudinaryData.append('timestamp', signatureData.timestamp);
    cloudinaryData.append('folder', signatureData.folder);
    cloudinaryData.append('signature', signatureData.signature);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 30 * 60 * 1000;

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.min((event.loaded / event.total) * 92, 92));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(94);
          resolve(JSON.parse(xhr.responseText));
          return;
        }
        reject(new Error(getUploadErrorMessage(xhr, `Cloudinary upload failed with status ${xhr.status}.`)));
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error while uploading directly to Cloudinary.'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out. Try a shorter video or a stronger connection.'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled.'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/video/upload`);
      uploadRequestRef.current = xhr;
      xhr.send(cloudinaryData);
    });
  }, []);

  // Upload straight to Cloudinary, then ask Django to save the returned URL.
  const uploadVideoToBackend = useCallback(async (file, formData) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Please login before uploading a video.');
    }

    try {
      const cloudinaryUpload = await uploadDirectlyToCloudinary(file, token);
      setUploadProgress(96);
      const response = await saveUploadedVideoMetadata(cloudinaryUpload, formData, token);
      setUploadProgress(100);

      const formattedVideo = {
        id: response.id,
        title: response.title,
        description: response.description,
        videoUrl: response.video_url || cloudinaryUpload.secure_url,
        thumbnailUrl: response.thumbnail_url || cloudinaryUpload.thumbnail_url || null,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        viewCount: 0,
        user: {
          id: response.user_id,
          name: response.username || "You",
          profilePic: response.profile_pic,
          university: response.university || '',
          followers: 0,
          videos: 0,
        },
        uploadDate: response.created_at,
        views: 0,
        created_at: response.created_at,
        cloudinary_public_id: response.cloudinary_public_id || cloudinaryUpload.public_id,
      };
      const videoWithFreshProfile = applyUserProfileToVideos(
        [formattedVideo],
        readCachedJson('currentUser'),
      )[0];
      setPendingUploadedVideo(videoWithFreshProfile);
      setIsUploading(false);
      setUploadComplete(true);
      uploadRequestRef.current = null;
      return videoWithFreshProfile;
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }

    const data = new FormData();
    data.append('video', file); // Backend expects 'video' field
    data.append('title', formData.title.trim());
    data.append('description', formData.description.trim());
    // Remove topics - backend handles video metadata differently

    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          console.log('Upload response status:', xhr.status);
          console.log('Upload response:', xhr.responseText);
          
          setUploadProgress(100);
          
          if (xhr.status === 201) {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Video saved to database:', response);
            // Backend returns: {id, title, description, video (Cloudinary URL), created_at}
            const formattedVideo = {
              id: response.id,
              title: response.title,
              description: response.description,
              videoUrl: response.video || response.video_url,  // Cloudinary URL from backend
              thumbnailUrl: null,  // Backend generates this separately
              likeCount: 0,
              commentCount: 0,
              shareCount: 0,
              viewCount: 0,
              user: {
                id: response.user_id,
                name: response.username || "You",
                profilePic: response.profile_pic,
                university: response.university || '',
                followers: 0,
                videos: 0,
              },
              uploadDate: response.created_at,
              views: 0,
              created_at: response.created_at,
            };
            const videoWithFreshProfile = applyUserProfileToVideos(
              [formattedVideo],
              currentUser || readCachedJson('currentUser'),
            )[0];
            setPendingUploadedVideo(videoWithFreshProfile);
            setIsUploading(false);
            setUploadComplete(true);
            uploadRequestRef.current = null;
            resolve(videoWithFreshProfile);
          } else {
            const errorMsg = `Upload failed with status ${xhr.status}: ${xhr.responseText}`;
            console.error(errorMsg);
            reject(new Error(errorMsg));
          }
        });

        xhr.addEventListener('error', () => {
          console.error('Upload network error:', xhr.statusText);
          reject(new Error('Network error: ' + xhr.statusText));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled.'));
        });

        xhr.open('POST', `${API_BASE_URL}/videos/`);
        xhr.setRequestHeader('Authorization', `Token ${token}`);
        uploadRequestRef.current = xhr;
        xhr.send(data);
      });
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  }, []);

  // Handle form submission and actual upload
  const handleUploadSubmit = async () => {
    if (!selectedFile || !uploadFormData.title.trim()) {
      alert('Please provide a title for your video');
      return;
    }

    if (!uploadFormData.description.trim()) {
      alert('Please provide a description for your video');
      return;
    }

    setShowUploadForm(false);
    setShowUploadModal(true);
    setIsUploading(true);
    setIsCancellingUpload(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setPendingUploadedVideo(null);

    try {
      await uploadVideoToBackend(selectedFile, uploadFormData);
      
    } catch (error) {
      if (error.message === 'Upload cancelled.') {
        return;
      }

      console.error('Upload failed:', error);
      alert('❌ Upload failed: ' + error.message + '\n\nPlease check your connection and try again.');
      
      // Don't add fake videos - only real backend uploads count
      // Reset the form so user can retry
      setSelectedFile(null);
      setUploadFormData({
        title: '',
        description: '',
        topics: [{ title: '', content: '' }]
      });
    } finally {
      setIsUploading(false);
      uploadRequestRef.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetUploadState = useCallback(() => {
    setIsUploading(false);
    setIsCancellingUpload(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setPendingUploadedVideo(null);
    setShowUploadModal(false);
    setShowUploadForm(false);
    setSelectedFile(null);
    setUploadFormData({
      title: '',
      description: '',
      topics: [{ title: '', content: '' }]
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const deletePendingUpload = useCallback(async () => {
    if (!pendingUploadedVideo?.id) {
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/videos/${pendingUploadedVideo.id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Token ${token}` },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error('The uploaded video could not be deleted. Please try again.');
    }
  }, [pendingUploadedVideo]);

  const cancelUpload = useCallback(async () => {
    if (isCancellingUpload) {
      return;
    }

    if (uploadRequestRef.current && isUploading) {
      uploadRequestRef.current.abort();
    }

    setIsCancellingUpload(true);
    try {
      await deletePendingUpload();
      resetUploadState();
    } catch (error) {
      console.error('Cancel upload failed:', error);
      alert(error.message);
      setIsCancellingUpload(false);
    }
  }, [deletePendingUpload, isCancellingUpload, isUploading, resetUploadState]);

  const finishUpload = useCallback(() => {
    if (!pendingUploadedVideo) {
      alert('Your video is still being saved. Please wait a moment, then tap Finish.');
      return;
    }

    setVideos(prev => {
      const updatedVideos = [pendingUploadedVideo, ...prev];
      writeCachedJson('cachedVideos', updatedVideos);
      return updatedVideos;
    });
    setFilteredVideos(prev => [pendingUploadedVideo, ...prev]);
    setCurrentVideoIndex(0);
    resetUploadState();
  }, [pendingUploadedVideo, resetUploadState]);

  // Search filtering
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = videos.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.topics && video.topics.some(topic => 
          topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.content.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
      setFilteredVideos(filtered);
      setCurrentVideoIndex(0);
    } else {
      setFilteredVideos(videos);
    }
  }, [searchQuery, videos]);

  // Video control functions
  const togglePlay = useCallback((videoId) => {
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], isPlaying: !prev[videoId]?.isPlaying }
    }));
  }, []);

  const handleVideoClick = useCallback((videoId) => {
    togglePlay(videoId);
  }, [togglePlay]);

  const handleVideoTimeUpdate = useCallback((videoId, currentTime, duration, progress) => {
    setVideoStates(prev => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        currentTime,
        duration,
        progress
      }
    }));
  }, []);

  // Scroll handling
  const handleScroll = useCallback((e) => {
    if (isScrolling) return;
    
    // Check if we're scrolling in the sidebar (don't switch videos if scrolling sidebar)
    const isSidebarScroll = e.target.closest('.video-info-sidebar-container');
    if (isSidebarScroll) return;
    
    setIsScrolling(true);
    const delta = Math.sign(e.deltaY);
    
    if (delta > 0 && currentVideoIndex < filteredVideos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      // Pause current video when switching
      if (currentVideo) {
        setVideoStates(prev => ({
          ...prev,
          [currentVideo.id]: { ...prev[currentVideo.id], isPlaying: false }
        }));
      }
    } else if (delta < 0 && currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
      if (currentVideo) {
        setVideoStates(prev => ({
          ...prev,
          [currentVideo.id]: { ...prev[currentVideo.id], isPlaying: false }
        }));
      }
    }
    
    setTimeout(() => setIsScrolling(false), 500);
  }, [isScrolling, currentVideoIndex, filteredVideos.length, currentVideo]);

  const throttledScroll = useThrottle(handleScroll, 500);

  // Touch handling with velocity detection
  const handleTouchStart = useCallback((e) => {
    // Don't handle touch if it's on the sidebar
    if (e.target.closest('.video-info-sidebar-container')) return;

    const touchStartY = e.touches[0].clientY;
    const touchStartTime = Date.now();
    
    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      const deltaTime = Date.now() - touchStartTime;
      const velocity = Math.abs(deltaY) / deltaTime;

      if (Math.abs(deltaY) > 50 || velocity > 0.3) {
        if (deltaY > 0 && currentVideoIndex < filteredVideos.length - 1) {
          setCurrentVideoIndex(prev => prev + 1);
          if (currentVideo) {
            setVideoStates(prev => ({
              ...prev,
              [currentVideo.id]: { ...prev[currentVideo.id], isPlaying: false }
            }));
          }
        } else if (deltaY < 0 && currentVideoIndex > 0) {
          setCurrentVideoIndex(prev => prev - 1);
          if (currentVideo) {
            setVideoStates(prev => ({
              ...prev,
              [currentVideo.id]: { ...prev[currentVideo.id], isPlaying: false }
            }));
          }
        }
      }
      
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchend', handleTouchEnd);
  }, [currentVideoIndex, filteredVideos.length, currentVideo]);

  // Scroll and touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', throttledScroll, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', throttledScroll);
        container.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [throttledScroll, handleTouchStart]);

  // Keyboard shortcuts - now ignores input fields
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check if the active element is an input field, textarea, or contenteditable
      const activeElement = document.activeElement;
      const isInputField = 
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable;
      
      // If user is typing in an input field, don't handle keyboard shortcuts
      if (isInputField) {
        return;
      }

      // Handle keyboard shortcuts only when not in input fields
      if (e.code === 'Space') {
        e.preventDefault();
        if (currentVideo) {
          togglePlay(currentVideo.id);
        }
      } else if (e.code === 'ArrowDown' && currentVideoIndex < filteredVideos.length - 1) {
        e.preventDefault();
        setCurrentVideoIndex(prev => prev + 1);
      } else if (e.code === 'ArrowUp' && currentVideoIndex > 0) {
        e.preventDefault();
        setCurrentVideoIndex(prev => prev - 1);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentVideo, currentVideoIndex, filteredVideos.length, togglePlay]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Sample videos data (fallback)
  const sampleVideos = [
    {
      id: 1,
      title: "Introduction to Machine Learning",
      description: "Learn the basics of machine learning algorithms and their applications in real-world scenarios. This video covers fundamental concepts that every computer science student should know. We'll explore supervised learning, unsupervised learning, and deep learning architectures.",
      uploadDate: "2023-10-15",
      views: "125K",
      user: {
        name: "Dr. Sarah Johnson",
        profilePic: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
        university: "Stanford University",
        department: "Computer Science",
        followers: "12.5K",
        videos: 47,
        isVerified: true
      },
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      likes: "2.4K",
      shares: "356",
      comments: "128",
      duration: "15:30",
      topics: [
        {
          title: "Machine Learning Fundamentals",
          content: "Comprehensive explanation about ML fundamentals and applications in modern technology."
        },
        {
          title: "Neural Networks",
          content: "Understanding how artificial neural networks work and their architecture."
        }
      ]
    },
    {
      id: 2,
      title: "Deep Learning Fundamentals",
      description: "Understanding neural networks and deep learning architectures for modern AI applications. This video dives into convolutional neural networks, recurrent neural networks, and transformer architectures.",
      uploadDate: "2023-10-20",
      views: "89K",
      user: {
        name: "Prof. Michael Chen",
        profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
        university: "MIT",
        department: "AI Research",
        followers: "8.7K",
        videos: 32,
        isVerified: true
      },
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      likes: "1.8K",
      shares: "289",
      comments: "94",
      duration: "22:15",
      topics: [
        {
          title: "Deep Learning Architectures",
          content: "Exploring different deep learning models and their use cases."
        }
      ]
    }
  ];

  if (isCheckingSession) {
    return (
      <div className="main-page tiktok-style">
        <div className="no-results">
          <h3>Checking your session...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="main-page tiktok-style" ref={containerRef}>
      <Header onUploadClick={handleUploadClick} onSearch={handleSearch} user={currentUser} />
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="video/*"
        style={{ display: 'none' }}
      />
      
      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="upload-modal-overlay">
          <div className="upload-form-modal">
            <h3>Describe Your Video</h3>
            <div className="upload-form">
              <div className="form-group">
                <label>Video Title *</label>
                <input
                  type="text"
                  value={uploadFormData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="Enter a compelling title for your video"
                />
              </div>
              
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={uploadFormData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Describe what your video is about..."
                  rows="4"
                  required
                />
              </div>
              
              <div className="topics-section">
                <label>Topics Covered</label>
                {uploadFormData.topics.map((topic, index) => (
                  <div key={index} className="topic-input-group">
                    <input
                      type="text"
                      value={topic.title}
                      onChange={(e) => handleTopicChange(index, 'title', e.target.value)}
                      placeholder="Topic title"
                    />
                    <input
                      type="text"
                      value={topic.content}
                      onChange={(e) => handleTopicChange(index, 'content', e.target.value)}
                      placeholder="Topic description"
                    />
                    {uploadFormData.topics.length > 1 && (
                      <button 
                        type="button" 
                        className="remove-topic-btn"
                        onClick={() => removeTopic(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  className="add-topic-btn"
                  onClick={addTopic}
                >
                  Add Another Topic
                </button>
              </div>
              
              <div className="form-actions">
                <button 
                  onClick={cancelUpload}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUploadSubmit}
                  className="upload-submit-btn"
                  disabled={!uploadFormData.title.trim() || !uploadFormData.description.trim()}
                >
                  Upload Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Progress Modal */}
      {showUploadModal && (
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <div className="upload-status-icon">
              {uploadComplete ? <FaCheck /> : Math.round(uploadProgress)}
            </div>
            <h3>{uploadComplete ? 'Ready to publish' : uploadProgress >= 100 ? 'Finalizing video' : 'Uploading video'}</h3>
            <p className="upload-status-copy">
              {uploadComplete
                ? 'Your video is saved. Finish will add it to the feed; Cancel will remove it.'
                : uploadProgress >= 100
                  ? 'The file reached the server. Cloudinary and Postgres are finishing the save.'
                  : 'Keep this window open while your video uploads.'}
            </p>
            {uploadComplete ? (
              <>
                <div className="upload-success">
                  <span><FaCheck /></span>
                  <p>Video uploaded successfully!</p>
                </div>
                <div className="upload-button-group upload-decision-actions">
                  <button 
                    onClick={cancelUpload}
                    className="upload-action-btn upload-action-btn--cancel"
                  >
                    <FaTimes aria-hidden="true" />
                    <span>Cancel</span>
                  </button>
                  <button 
                    onClick={finishUpload}
                    className="upload-action-btn upload-action-btn--finish"
                  >
                    <FaCheck aria-hidden="true" />
                    <span>Finish</span>
                  </button>
                </div>
              </>
            ) : isUploading ? (
              <>
                <div className="upload-progress-bar">
                  <div 
                    className="upload-progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="upload-percent">{Math.round(uploadProgress)}%</p>
                <div className="upload-button-group upload-decision-actions">
                  <button
                    onClick={cancelUpload}
                    className="upload-action-btn upload-action-btn--cancel"
                    disabled={isCancellingUpload}
                  >
                    <FaTimes aria-hidden="true" />
                    <span>{isCancellingUpload ? 'Cancelling...' : 'Cancel'}</span>
                  </button>
                  <button className="upload-action-btn upload-action-btn--finish" disabled aria-busy="true">
                    <FaCheck aria-hidden="true" />
                    <span>Saving...</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="upload-success">
                  <span><FaCheck /></span>
                  <p>Video uploaded successfully!</p>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="close-upload-btn"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="content-container">
        {/* Video Feed Container */}
        <div className="video-feed-container">
          {filteredVideos.map((video, index) => (
            <div 
              key={video.id}
              className={`video-section ${index === currentVideoIndex ? 'active' : 'inactive'}`}
            >
              <div className="video-content-wrapper">
                {/* Video Player - 3/4 width on PC, full width on mobile */}
                <div className="video-player-section">
                  <VideoPlayer
                    videoUrl={video.videoUrl}
                    isPlaying={videoStates[video.id]?.isPlaying || false}
                    onTogglePlay={() => togglePlay(video.id)}
                    onVideoClick={() => handleVideoClick(video.id)}
                    onTimeUpdate={(currentTime, duration, progress) => 
                      handleVideoTimeUpdate(video.id, currentTime, duration, progress)
                    }
                    showOverlay={index === currentVideoIndex}
                    isMobile={isMobile}
                  />
                  
                  {/* Mobile Video Info - Only visible on mobile */}
                  {isMobile && (
                    <div className={`mobile-video-info ${isVideoInfoExpanded ? 'expanded' : 'collapsed'}`}>
                      <div className="video-info-drag-handle" onClick={() => setIsVideoInfoExpanded(!isVideoInfoExpanded)}>
                        <div className="drag-indicator"></div>
                      </div>
                      <VideoInfoSidebar 
                        video={video}
                        isMobile={true}
                        isExpanded={isVideoInfoExpanded}
                        onToggleExpand={() => setIsVideoInfoExpanded(!isVideoInfoExpanded)}
                        isFollowing={isFollowing}
                        onToggleFollow={() => setIsFollowing(!isFollowing)}
                      />
                    </div>
                  )}

                  {/* Scroll Indicator */}
                  {index === currentVideoIndex && filteredVideos.length > 1 && (
                    <div className="scroll-indicator">
                      <span>↓ Scroll for next video ↑</span>
                    </div>
                  )}
                </div>

                {/* Video Info Sidebar - 1/4 width on PC, hidden on mobile */}
                {!isMobile && (
                  <div className="video-info-sidebar">
                    <VideoInfoSidebar 
                      video={video}
                      isMobile={false}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* No Results Message */}
          {filteredVideos.length === 0 && (
            <div className="no-results">
              <h3>No videos found</h3>
              <p>Try different search terms or upload your own video!</p>
              <button onClick={handleUploadClick} className="upload-cta-btn">
                Upload Your First Video
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Video Controls - Only progress bar at bottom */}
      {isMobile && currentVideo && (
        <MobileVideoControls 
          currentTime={currentVideoState.currentTime || 0}
          duration={currentVideoState.duration || 0}
          progress={currentVideoState.progress || 0}
        />
      )}

      {/* Bottom Navigation - TikTok Style */}
      <BottomNav onUploadClick={handleUploadClick} />
    </div>
  );
};

export default MainPage;
