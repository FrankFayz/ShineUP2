import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/AuthPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          setStatus('error');
          setMessage('No verification token provided.');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/verify-email/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Store token and redirect to main page
          localStorage.setItem('authToken', data.token);
          setUser(data.user);
          setStatus('success');
          setMessage('✅ Email verified successfully! Your account is now active.');
          
          // Redirect to main page after 2 seconds
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.detail || 'Email verification failed. The link may be expired.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card email-verification-card">
        <h1>Email Verification</h1>
        
        <div className={`verification-status ${status}`}>
          {status === 'verifying' && (
            <div className="spinner">
              <div></div>
              <div></div>
              <div></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="success-icon">✓</div>
          )}
          
          {status === 'error' && (
            <div className="error-icon">✕</div>
          )}
        </div>

        <p className={`verification-message ${status}`}>
          {message}
        </p>

        {status === 'error' && (
          <div className="verification-actions">
            <button
              onClick={() => navigate('/auth', { replace: true })}
              className="btn btn-primary"
            >
              Back to Login
            </button>
            <button
              onClick={() => navigate('/resend-verification')}
              className="btn btn-secondary"
            >
              Resend Verification Email
            </button>
          </div>
        )}

        {status === 'success' && (
          <p className="redirect-message">Redirecting to dashboard...</p>
        )}
      </div>

      <style>{`
        .email-verification-card {
          max-width: 400px;
          text-align: center;
          padding: 40px 30px;
        }

        .verification-status {
          margin: 30px 0;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          display: flex;
          gap: 8px;
        }

        .spinner div {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #007bff;
          animation: spin 1.4s infinite;
        }

        .spinner div:nth-child(2) {
          animation-delay: 0.2s;
        }

        .spinner div:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes spin {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .success-icon {
          font-size: 60px;
          color: #28a745;
          font-weight: bold;
        }

        .error-icon {
          font-size: 60px;
          color: #dc3545;
          font-weight: bold;
        }

        .verification-message {
          font-size: 16px;
          margin: 20px 0;
          line-height: 1.6;
        }

        .verification-message.success {
          color: #28a745;
        }

        .verification-message.error {
          color: #dc3545;
        }

        .verification-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 30px;
        }

        .redirect-message {
          color: #666;
          font-size: 14px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default EmailVerificationPage;
