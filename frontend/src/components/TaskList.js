import React, { useState } from 'react';

function TaskList({ tasks, loading, onTaskUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingTask 
        ? `/api/tasks/${editingTask.id}`
        : '/api/tasks';
      
      const method = editingTask ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ title: '', description: '' });
        setShowForm(false);
        setEditingTask(null);
        onTaskUpdate();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...task,
          completed: !task.completed
        }),
      });

      if (response.ok) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Add Task Form */}
      {showForm && (
        <div className="task-form">
          <h3>{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Task Title</label>
              <input
                type="text"
                id="title"
                className="form-control"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn">
                {editingTask ? 'Update Task' : 'Add Task'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                  setFormData({ title: '', description: '' });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Task Button */}
      {!showForm && (
        <div className="card">
          <button 
            className="btn"
            onClick={() => setShowForm(true)}
          >
            + Add New Task
          </button>
        </div>
      )}

      {/* Task List */}
      <div>
        {tasks.length === 0 ? (
          <div className="card text-center">
            <p className="text-muted">No tasks yet. Create your first task to get started!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <div className="task-header">
                <div style={{ flex: 1 }}>
                  <h3 
                    className="task-title"
                    style={{ 
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? '#6c757d' : '#333'
                    }}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                </div>
                <div className="d-flex align-center gap-2">
                  <span className="badge badge-primary">
                    {task.sessions_count} sessions
                  </span>
                  {task.completed && (
                    <span className="badge badge-success">Completed</span>
                  )}
                </div>
              </div>
              
              <div className="task-meta">
                <span>Created: {formatDate(task.created_at)}</span>
              </div>
              
              <div className="task-actions">
                <button
                  className={`btn ${task.completed ? 'btn-secondary' : 'btn-success'}`}
                  onClick={() => handleToggleComplete(task)}
                >
                  {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleEdit(task)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TaskList; 