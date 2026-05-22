import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, register, loading, error, setError } = useAuth();

  const handleTabChange = (loginTab) => {
    setIsLoginTab(loginTab);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setFormError('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setFormError('All fields are required.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setFormError('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (!isLoginTab && password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      if (isLoginTab) {
        await login(trimmedUsername, password);
      } else {
        await register(trimmedUsername, password);
      }
    } catch (err) {
     
      console.error('Authentication attempt failed:', err.message);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="https://api.dicebear.com/7.x/identicon/svg?seed=discord" alt="Discord Logo" />
          <h1>Discord</h1>
        </div>

        <div className="auth-header">
          <h2>{isLoginTab ? 'Welcome Back!' : 'Create an Account'}</h2>
          <p>{isLoginTab ? "We're so excited to see you again!" : 'Join the conversation today!'}</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${isLoginTab ? 'active' : ''}`}
            onClick={() => handleTabChange(true)}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${!isLoginTab ? 'active' : ''}`}
            onClick={() => handleTabChange(false)}
          >
            Register
          </button>
        </div>

        {(formError || error) && (
          <div className="auth-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{formError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <input
                id="username"
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={loading}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {!isLoginTab && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Connecting...' : isLoginTab ? 'Log In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
