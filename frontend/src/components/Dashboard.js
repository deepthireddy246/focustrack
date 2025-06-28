import React, { useState, useEffect } from 'react';
import TaskList from './TaskList';
import PomodoroTimer from './PomodoroTimer';
import Statistics from './Statistics';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const tasksData = await response.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = () => {
    fetchTasks();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-content">
          <a href="#" className="navbar-brand">FocusTrack</a>
          <div className="navbar-user">
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button onClick={onLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Tab Navigation */}
        <div className="tab-container">
          <div 
            className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </div>
          <div 
            className={`tab ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => setActiveTab('timer')}
          >
            Pomodoro Timer
          </div>
          <div 
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'tasks' && (
          <TaskList 
            tasks={tasks} 
            loading={loading}
            onTaskUpdate={handleTaskUpdate}
          />
        )}

        {activeTab === 'timer' && (
          <PomodoroTimer 
            tasks={tasks}
            onSessionComplete={handleTaskUpdate}
          />
        )}

        {activeTab === 'stats' && (
          <Statistics />
        )}
      </div>
    </div>
  );
}

export default Dashboard; 