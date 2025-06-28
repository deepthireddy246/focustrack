import React, { useState } from 'react';

function Login({ onLogin, onToggleMode }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user, data.access_token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-center mb-4">Login</h2>
      
      {error && (
        <div className="alert alert-danger mb-3" style={{ color: '#dc3545', padding: '12px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            className="form-control"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          className="btn w-100"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="text-center mt-3">
        <p className="text-muted">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            style={{ background: 'none', border: 'none', color: '#667eea', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login; 