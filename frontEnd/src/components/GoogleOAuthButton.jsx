import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GoogleOAuthButton.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const GoogleOAuthButton = ({ onSuccess, isLoading, setIsLoading }) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Load Google Platform Library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Initialize Google Sign-In when script is loaded
    script.onload = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            error_callback: () => {
              setError('Failed to initialize Google Sign-In. Please refresh the page.');
              setIsInitializing(false);
            },
          });

          // Render the button
          if (document.getElementById('google-signin-button')) {
            window.google.accounts.id.renderButton(
              document.getElementById('google-signin-button'),
              {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'signin_with',
                locale: 'en',
              }
            );
            setIsInitializing(false);
          }
        } catch (err) {
          console.error('Google initialization error:', err);
          setError('Google Sign-In not available. Check your client ID.');
          setIsInitializing(false);
        }
      } else {
        setError('Google library failed to load. Please refresh the page.');
        setIsInitializing(false);
      }
    };

    script.onerror = () => {
      setError('Failed to load Google Sign-In script. Check your internet connection.');
      setIsInitializing(false);
    };

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script already removed
      }
    };
  }, []);

  const handleGoogleSignIn = async (response) => {
    if (!response.credential) {
      setError('No credential received from Google. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send credential (JWT token) to backend
      const backendResponse = await fetch(`${API_BASE_URL}/auth/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: response.credential }),
      });

      const data = await backendResponse.json();

      if (backendResponse.ok) {
        // Store the authentication token
        localStorage.setItem('authToken', data.token);

        if (onSuccess) {
          onSuccess(data.user, data.is_new);
        }

        // Show welcome message based on whether user is new
        if (data.is_new) {
          // New user - redirect to profile completion
          localStorage.setItem('welcomeMessage', 'Welcome to ShineUP! Complete your profile.');
          navigate('/profile', { replace: true });
        } else {
          // Existing user - redirect to home
          localStorage.setItem('welcomeMessage', 'Welcome back to ShineUP!');
          navigate('/', { replace: true });
        }
      } else {
        // Handle backend errors
        const errorMessage = data.detail || data.error || 'Google login failed';
        setError(errorMessage);
        console.error('Backend error:', data);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="google-oauth-wrapper">
      {error && (
        <div className="google-oauth-error">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>Sign-in Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}
      <div className="google-signin-container">
        {isInitializing && (
          <div className="google-loading">
            <div className="spinner"></div>
            <span>Loading Google Sign-In...</span>
          </div>
        )}
        <div id="google-signin-button" style={{ width: '100%' }}></div>
      </div>
    </div>
  );
};

export default GoogleOAuthButton;
