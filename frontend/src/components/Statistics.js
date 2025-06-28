import React, { useState, useEffect } from 'react';

function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sessions/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      } else {
        setError('Failed to load statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center text-danger">{error}</div>
        <div className="text-center mt-3">
          <button className="btn" onClick={fetchStats}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h2>Today's Productivity</h2>
        <p className="stats-date">{formatDate(stats.date)}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total_work_sessions}</div>
          <div className="stat-label">Work Sessions</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.total_break_sessions}</div>
          <div className="stat-label">Break Sessions</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{formatTime(stats.total_work_time)}</div>
          <div className="stat-label">Total Work Time</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{formatTime(stats.total_break_time)}</div>
          <div className="stat-label">Total Break Time</div>
        </div>
      </div>

      {/* Productivity Score */}
      <div className="card mt-4">
        <h3 className="text-center mb-3">Productivity Score</h3>
        <div className="text-center">
          {stats.total_work_sessions > 0 ? (
            <div>
              <div className="stat-number" style={{ fontSize: '3rem' }}>
                {Math.round((stats.total_work_sessions / (stats.total_work_sessions + stats.total_break_sessions)) * 100)}%
              </div>
              <p className="text-muted">Focus Efficiency</p>
            </div>
          ) : (
            <div>
              <div className="stat-number" style={{ fontSize: '3rem', color: '#6c757d' }}>
                0%
              </div>
              <p className="text-muted">No sessions completed today</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Tasks */}
      {stats.top_tasks.length > 0 && (
        <div className="top-tasks">
          <h3>Most Productive Tasks Today</h3>
          {stats.top_tasks.map((task, index) => (
            <div key={index} className="top-task-item">
              <span className="top-task-title">{task.title}</span>
              <span className="top-task-sessions">{task.sessions} sessions</span>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="card mt-4">
        <h3>Productivity Tips</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Aim for 4-6 Pomodoro sessions per day for optimal productivity</li>
          <li>Take regular breaks to maintain focus and prevent burnout</li>
          <li>Track your progress to identify your most productive patterns</li>
          <li>Complete tasks in smaller, focused sessions rather than long marathons</li>
        </ul>
      </div>

      {/* Refresh Button */}
      <div className="text-center mt-4">
        <button className="btn" onClick={fetchStats}>
          Refresh Statistics
        </button>
      </div>
    </div>
  );
}

export default Statistics; 