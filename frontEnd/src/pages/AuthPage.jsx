import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import GoogleOAuthButton from '../components/GoogleOAuthButton';
import '../styles/AuthPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const initialState = {
  username: '',
  email: '',
  university: '',
  course: '',
  year: '',
  careerInterests: '',
  password: '',
  confirmPassword: ''
};

const AuthPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [isLogin, setIsLogin] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ==================== BACKEND INTEGRATION: CHECK EXISTING SESSION ====================
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Check if user has a stored token
        const token = localStorage.getItem('authToken');
        if (!token) {
          return;
        }
        
        // Verify token is still valid
        const response = await fetch(`${API_BASE_URL}/auth/verify-session/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setIsAuthenticated(true);
          if (onLogin) {
            onLogin(userData.user); // Redirect to main dashboard
          }
          navigate('/', { replace: true });
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.log('No active session found');
        localStorage.removeItem('authToken');
      }
    };

    checkExistingSession();
  }, [navigate, onLogin]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  // ==================== BACKEND INTEGRATION: LOGIN HANDLER ====================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: loginUsername.trim(),
          password: password 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store the authentication token
        localStorage.setItem('authToken', data.token);
        
        setIsAuthenticated(true);
        setIsLoading(false);
        
        // Redirect to main dashboard
        if (onLogin) {
          onLogin(data.user);
        }
        navigate('/', { replace: true });
        
      } else {
        const errorData = await response.json();
        alert(`❌ Login failed: ${Object.values(errorData).flat().join(', ')}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  // ==================== BACKEND INTEGRATION: REGISTRATION HANDLER ====================
  // Django Backend Team: This function sends registration data to your backend
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (form.password !== form.confirmPassword) {
        alert('Passwords do not match. Please confirm your password.');
        setIsLoading(false);
        return;
      }

      const registerData = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        university: form.university.trim(),
        course: form.course.trim(),
        year: Number(form.year),
        career_interests: form.careerInterests.trim(),
        first_name: form.username.trim(),
        last_name: '',
      };
      
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store the authentication token
        localStorage.setItem('authToken', data.token);
        
        setIsAuthenticated(true);
        setIsLoading(false);
        alert('✅ Registration successful! Welcome to ShineUP');
        
        // Redirect to main dashboard
        if (onLogin) {
          onLogin(data.user);
        }
        navigate('/', { replace: true });
        
      } else {
        const errorData = await response.json();
        const errorMessage = Object.values(errorData).flat().join(', ') || 'Registration failed';
        alert(`❌ Registration failed: ${errorMessage}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('❌ Network error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear token from localStorage
      localStorage.removeItem('authToken');
      
      // Redirect to login page
      setIsAuthenticated(false);
      setLoginUsername('');
      setPassword('');
      setForm(initialState);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear frontend state regardless of backend response
      setIsAuthenticated(false);
      setLoginUsername('');
      setPassword('');
      setForm(initialState);
      
      // Clear any stored tokens (though we're using sessions)
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    }
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setForm(initialState);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setLoginUsername('');
    setPassword('');
    setShowLoginPassword(false);
  };

  // ==================== BACKEND INTEGRATION: AUTHENTICATION STATUS ====================
  // If user is authenticated, show welcome message (this should redirect via parent)
  if (isAuthenticated) {
    return (
      <div className="auth-main-container">
        <div className="welcome-message">
          <h2>Welcome back!</h2>
          <p>Redirecting to your dashboard...</p>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-main-container">
      <div className="floating-elements">
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
      </div>
      
      <div className="auth-content-wrapper">
        <div className="auth-left">
          <div className="logo-circle">
            <span className="logo-text">🌟</span>
          </div>
          <h1 className="app-title">SHINE <span className="up-text">UP</span></h1>
          <p className="app-tagline">
            <span className="welcome-text">Welcome to the Academic Shine UP</span><br />
            <span className="desc-text">
              Where brilliance meets opportunity.<br />
              Upload, share, and shine before you graduate!
            </span>
          </p>
          
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🎓</span>
              <span className="feature-text">Academic Portfolio</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💼</span>
              <span className="feature-text">Employer Connections</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span className="feature-text">Career Launchpad</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⭐</span>
              <span className="feature-text">Skill Showcase</span>
            </div>
          </div>
          
          <div className="dev-pics">
            <img src="https://t2informatik.de/en/wp-content/uploads/sites/2/2019/07/development-team.jpg" alt="Developers" className="dev-img" />
            <p className="dev-caption">Meet the Opportunities Through Shine UP</p>
          </div>
        </div>
        
        <div className="auth-right">
          {isLogin ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <h2>Login to Your Account</h2>
              <p className="form-subtitle">Welcome back! Please enter your details.</p>
              
              <div className="input-group">
                <input 
                  type="text"
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group password-group">
                <input 
                  type={showLoginPassword ? 'text' : 'password'} 
                  placeholder="Enter your password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowLoginPassword(value => !value)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              <div className="remember-me">
                <label>
                  <input type="checkbox" defaultChecked /> Remember me
                </label>
              </div>
              
              <button type="submit" disabled={isLoading}>
                {isLoading ? <div className="loading-spinner"></div> : 'Login'}
              </button>
              
              <div className="divider-with-text">
                <span>OR</span>
              </div>
              
              <GoogleOAuthButton 
                onSuccess={(user, isNew) => {
                  if (onLogin) {
                    onLogin(user);
                  }
                }} 
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
              
              <p className="auth-switch">
                Don't have an account?{' '}
                <span className="auth-link" onClick={switchToRegister}>
                  Sign up here
                </span>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <h2>Create Your Account</h2>
              <p className="form-subtitle">Join thousands of students showcasing their talents</p>
              
              <div className="input-group">
                <input 
                  type="text" 
                  name="username" 
                  placeholder="Username"
                  value={form.username} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email Address"
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="text" 
                  name="university" 
                  placeholder="University Name"
                  value={form.university} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="text" 
                  name="course" 
                  placeholder="Course/Program"
                  value={form.course} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="number" 
                  name="year" 
                  placeholder="Year of Study"
                  value={form.year} 
                  onChange={handleChange} 
                  min="1" 
                  max="8" 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="text" 
                  name="careerInterests" 
                  placeholder="Career Interests (e.g., Software Engineering, Data Science)"
                  value={form.careerInterests} 
                  onChange={handleChange} 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group password-group">
                <input 
                  type={showRegisterPassword ? 'text' : 'password'} 
                  name="password" 
                  placeholder="Enter Password"
                  value={form.password} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowRegisterPassword(value => !value)}
                  aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              <div className="input-group password-group">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  name="confirmPassword" 
                  placeholder="Confirm Password"
                  value={form.confirmPassword} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(value => !value)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              <button type="submit" disabled={isLoading}>
                {isLoading ? <div className="loading-spinner"></div> : 'Create Account'}
              </button>
              
              <div className="divider-with-text">
                <span>OR</span>
              </div>
              
              <GoogleOAuthButton 
                onSuccess={(user, isNew) => {
                  if (onLogin) {
                    onLogin(user);
                  }
                }} 
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
              
              <p className="auth-switch">
                Already have an account?{' '}
                <span className="auth-link" onClick={switchToLogin}>
                  Login here
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
