import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCamera,
  FaComment,
  FaEye,
  FaHeart,
  FaLock,
  FaSignOutAlt,
  FaTrash,
  FaUpload,
  FaUserCircle,
  FaUsers,
  FaVideo,
} from 'react-icons/fa';
import Header from '../components/Header.jsx';
import BottomNav from '../components/BottomNav.jsx';
import '../styles/ProfilePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const emptyProfile = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  university: '',
  course: '',
  year: '',
  career_interests: '',
  bio: '',
  profile_pic: null,
};

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

const applyUserProfileToVideos = (videosList, user) => {
  if (!user?.id || !Array.isArray(videosList)) {
    return videosList || [];
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

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [stats, setStats] = useState({
    followers: 0,
    total_likes: 0,
    total_views: 0,
    total_comments: 0,
    total_videos: 0,
  });
  const [videos, setVideos] = useState([]);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicDataUrl, setProfilePicDataUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('authToken');

  const authHeaders = useMemo(() => ({
    Authorization: `Token ${token}`,
  }), [token]);

  const loadProfile = async () => {
    if (!token) {
      navigate('/auth', { replace: true });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/profile/`, { headers: authHeaders });
      if (!response.ok) {
        localStorage.removeItem('authToken');
        navigate('/auth', { replace: true });
        return;
      }
      const data = await response.json();
      const userForUi = mergeLocalProfilePic(data.user);
      setProfile({ ...emptyProfile, ...userForUi, year: userForUi.year || '' });
      setStats(data.stats || {});
      setVideos(data.videos || []);
      setPreviewUrl(userForUi.local_profile_pic || userForUi.profile_pic || '');
      writeCachedJson('currentUser', userForUi);
    } catch (error) {
      const cachedUser = readCachedJson('currentUser');
      const cachedVideos = readCachedJson('cachedVideos', []);
      if (cachedUser) {
        setProfile({ ...emptyProfile, ...cachedUser, year: cachedUser.year || '' });
        setPreviewUrl(cachedUser.profile_pic || '');
        setVideos(applyUserProfileToVideos(cachedVideos, cachedUser));
      }
      setMessage('Could not load your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFieldChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePicChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePicFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfilePicDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    const formData = new FormData();
    Object.entries(profile).forEach(([key, value]) => {
      if (key !== 'profile_pic' && value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    if (profilePicFile) {
      formData.append('profile_pic', profilePicFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/profile/`, {
        method: 'PATCH',
        headers: authHeaders,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(Object.values(data).flat().join(', ') || 'Profile update failed.');
      }
      const userForUi = {
        ...data.user,
        local_profile_pic: profilePicDataUrl || readCachedJson('currentUser')?.local_profile_pic || '',
      };
      setProfile({ ...emptyProfile, ...userForUi, year: userForUi.year || '' });
      setStats(data.stats || stats);
      setVideos(data.videos || videos);
      setPreviewUrl(userForUi.local_profile_pic || userForUi.profile_pic || previewUrl);
      setProfilePicFile(null);
      setProfilePicDataUrl('');
      writeCachedJson('currentUser', userForUi);
      const updatedCachedVideos = applyUserProfileToVideos(readCachedJson('cachedVideos', []), userForUi);
      writeCachedJson('cachedVideos', updatedCachedVideos);
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { user: userForUi } }));
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password/`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(Object.values(data).flat().join(', ') || 'Password change failed.');
      }
      localStorage.setItem('authToken', data.token);
      setPasswordForm({ current_password: '', new_password: '' });
      setMessage('Password changed successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm('Delete this video from your profile and the database?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        throw new Error(data.detail || 'Video could not be deleted.');
      }
      await loadProfile();
      setMessage('Video deleted.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    navigate('/auth', { replace: true });
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    if (!window.confirm('Delete your account permanently? This removes your profile and videos.')) return;

    const formData = new FormData();
    formData.append('current_password', deletePassword);

    try {
      const response = await fetch(`${API_BASE_URL}/profile/`, {
        method: 'DELETE',
        headers: authHeaders,
        body: formData,
      });
      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        throw new Error(Object.values(data).flat().join(', ') || 'Account could not be deleted.');
      }
      logout();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const statItems = [
    { label: 'Followers', value: stats.followers || 0, icon: <FaUsers /> },
    { label: 'Likes', value: stats.total_likes || 0, icon: <FaHeart /> },
    { label: 'Views', value: stats.total_views || 0, icon: <FaEye /> },
    { label: 'Comments', value: stats.total_comments || 0, icon: <FaComment /> },
  ];

  return (
    <div className="profile-page-shell">
      <Header onUploadClick={() => navigate('/')} onSearch={() => {}} user={profile} />

      <main className="profile-page">
        {isLoading ? (
          <div className="profile-loading">Loading profile...</div>
        ) : (
          <>
            <div className="profile-topbar">
              <button
                type="button"
                className="profile-back-btn"
                onClick={() => navigate('/')}
                aria-label="Back to main page"
              >
                <FaArrowLeft />
                <span>Main page</span>
              </button>
            </div>

            <section className="profile-hero">
              <div className="profile-avatar-wrap">
                {previewUrl ? (
                  <img src={previewUrl} alt={profile.username} className="profile-main-avatar" />
                ) : (
                  <div className="profile-main-avatar profile-main-avatar-empty">
                    <FaUserCircle />
                  </div>
                )}
                <button className="avatar-edit-btn" type="button" onClick={() => fileInputRef.current?.click()}>
                  <FaCamera />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleProfilePicChange} />
              </div>

              <div className="profile-hero-copy">
                <p className="profile-eyebrow">Creator Profile</p>
                <h1>{profile.username}</h1>
                <p>{profile.university || 'Add your university'} {profile.course ? `- ${profile.course}` : ''}</p>
                {profile.bio && <p className="profile-hero-bio">{profile.bio}</p>}
                <div className="profile-hero-actions">
                  <button type="button" onClick={() => fileInputRef.current?.click()}>
                    <FaUpload /> Profile Pic
                  </button>
                  <button type="button" className="profile-logout-btn" onClick={logout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </div>
            </section>

            {message && <div className="profile-message">{message}</div>}

            <section className="profile-stats-strip">
              {statItems.map(item => (
                <div className="profile-stat" key={item.label}>
                  <span>{item.icon}</span>
                  <strong>{item.value}</strong>
                  <small>{item.label}</small>
                </div>
              ))}
            </section>

            <section className="profile-layout">
              <form className="profile-panel profile-edit-panel" onSubmit={saveProfile}>
                <div className="profile-section-heading">
                  <h2>Edit Profile</h2>
                  <p>Keep your public academic identity current.</p>
                </div>

                <div className="profile-form-grid">
                  <label>Username<input value={profile.username} onChange={(e) => handleFieldChange('username', e.target.value)} required /></label>
                  <label>Email<input type="email" value={profile.email} onChange={(e) => handleFieldChange('email', e.target.value)} required /></label>
                  <label>First name<input value={profile.first_name || ''} onChange={(e) => handleFieldChange('first_name', e.target.value)} /></label>
                  <label>Last name<input value={profile.last_name || ''} onChange={(e) => handleFieldChange('last_name', e.target.value)} /></label>
                  <label>University<input value={profile.university || ''} onChange={(e) => handleFieldChange('university', e.target.value)} required /></label>
                  <label>Course<input value={profile.course || ''} onChange={(e) => handleFieldChange('course', e.target.value)} required /></label>
                  <label>Year<input type="number" min="1" max="8" value={profile.year || ''} onChange={(e) => handleFieldChange('year', e.target.value)} required /></label>
                  <label>Career interests<input value={profile.career_interests || ''} onChange={(e) => handleFieldChange('career_interests', e.target.value)} /></label>
                </div>

                <label className="profile-wide-label">Bio<textarea value={profile.bio || ''} onChange={(e) => handleFieldChange('bio', e.target.value)} rows="4" /></label>
                <button className="profile-primary-btn" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Profile'}</button>
              </form>

              <aside className="profile-panel profile-account-panel">
                <div className="profile-section-heading">
                  <h2>Account</h2>
                  <p>Password, logout, and deletion controls.</p>
                </div>

                <form className="profile-stack-form" onSubmit={changePassword}>
                  <label>Current password<input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))} required /></label>
                  <label>New password<input type="password" minLength="8" value={passwordForm.new_password} onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))} required /></label>
                  <button type="submit"><FaLock /> Change Password</button>
                </form>

                <form className="profile-stack-form profile-danger-zone" onSubmit={deleteAccount}>
                  <label>Confirm password<input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required /></label>
                  <button type="submit"><FaTrash /> Delete Account</button>
                </form>
              </aside>
            </section>

            <section className="profile-videos-section">
              <div className="profile-section-heading">
                <h2>Uploaded Videos</h2>
                <p>{stats.total_videos || 0} videos saved on your profile.</p>
              </div>

              <div className="profile-video-grid">
                {videos.length === 0 ? (
                  <div className="profile-empty-videos">Your uploaded videos will appear here.</div>
                ) : videos.map(video => (
                  <article className="profile-video-tile" key={video.id}>
                    <div className="profile-video-preview">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} />
                      ) : (
                        <FaVideo />
                      )}
                    </div>
                    <div className="profile-video-body">
                      <h3>{video.title}</h3>
                      <p>{video.description}</p>
                      <div className="profile-video-meta">
                        <span><FaEye /> {video.view_count || 0}</span>
                        <span><FaHeart /> {video.like_count || 0}</span>
                        <span><FaComment /> {video.comment_count || 0}</span>
                      </div>
                      <button type="button" onClick={() => deleteVideo(video.id)}>
                        <FaTrash /> Delete Video
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav onUploadClick={() => navigate('/')} />
    </div>
  );
};

export default ProfilePage;
