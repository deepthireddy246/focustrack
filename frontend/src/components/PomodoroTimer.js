import React, { useState, useEffect, useRef } from 'react';

function PomodoroTimer({ tasks, onSessionComplete }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef(null);

  const WORK_TIME = 25 * 60; // 25 minutes
  const BREAK_TIME = 5 * 60; // 5 minutes

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return isBreak ? WORK_TIME : BREAK_TIME;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isBreak]);

  const handleSessionComplete = async () => {
    if (selectedTask && !isBreak) {
      // Record work session
      try {
        const token = localStorage.getItem('token');
        await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            task_id: selectedTask.id,
            session_type: 'work',
            duration: 25
          }),
        });
      } catch (error) {
        console.error('Error recording session:', error);
      }
    }

    if (isBreak) {
      // Record break session
      try {
        const token = localStorage.getItem('token');
        await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            task_id: selectedTask.id,
            session_type: 'break',
            duration: 5
          }),
        });
      } catch (error) {
        console.error('Error recording break session:', error);
      }
    }

    setSessionCount(prev => prev + 1);
    setIsBreak(!isBreak);
    setTimeLeft(isBreak ? WORK_TIME : BREAK_TIME);
    setIsRunning(false);
    
    // Notify parent component to refresh tasks
    onSessionComplete();

    // Show notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(
        isBreak ? 'Break Complete!' : 'Work Session Complete!',
        {
          body: isBreak 
            ? 'Time to get back to work!' 
            : 'Great job! Take a 5-minute break.',
          icon: '/favicon.ico'
        }
      );
    }
  };

  const startTimer = () => {
    if (!selectedTask && !isBreak) {
      alert('Please select a task to work on');
      return;
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? BREAK_TIME : WORK_TIME);
  };

  const skipSession = () => {
    setIsRunning(false);
    setIsBreak(!isBreak);
    setTimeLeft(isBreak ? WORK_TIME : BREAK_TIME);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestNotificationPermission = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const incompleteTasks = tasks.filter(task => !task.completed);

  return (
    <div>
      <div className="timer-container">
        <h2 className="text-center mb-4">
          {isBreak ? 'Break Time' : 'Focus Time'}
        </h2>
        
        <div className="timer-status">
          {isBreak 
            ? 'Take a 5-minute break to recharge'
            : selectedTask 
              ? `Working on: ${selectedTask.title}`
              : 'Select a task to start working'
          }
        </div>

        <div className="timer-display">
          {formatTime(timeLeft)}
        </div>

        <div className="timer-controls">
          {!isRunning ? (
            <button 
              className="btn btn-success"
              onClick={startTimer}
              disabled={!selectedTask && !isBreak}
            >
              Start {isBreak ? 'Break' : 'Work Session'}
            </button>
          ) : (
            <button 
              className="btn btn-secondary"
              onClick={pauseTimer}
            >
              Pause
            </button>
          )}
          
          <button 
            className="btn btn-secondary"
            onClick={resetTimer}
          >
            Reset
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={skipSession}
          >
            Skip
          </button>
        </div>

        <div className="text-center mt-3">
          <p className="text-muted">
            Sessions completed today: {sessionCount}
          </p>
        </div>
      </div>

      {/* Task Selection */}
      {!isBreak && (
        <div className="card">
          <h3 className="mb-3">Select a Task to Work On</h3>
          
          {incompleteTasks.length === 0 ? (
            <p className="text-muted">No incomplete tasks available. Create a new task to get started!</p>
          ) : (
            <div className="d-flex gap-2" style={{ flexWrap: 'wrap' }}>
              {incompleteTasks.map(task => (
                <button
                  key={task.id}
                  className={`btn ${selectedTask?.id === task.id ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setSelectedTask(task)}
                  disabled={isRunning}
                >
                  {task.title}
                  <span className="badge" style={{ marginLeft: '8px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    {task.sessions_count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current Task Info */}
      {selectedTask && !isBreak && (
        <div className="current-task">
          <h3>Current Task</h3>
          <p><strong>{selectedTask.title}</strong></p>
          {selectedTask.description && (
            <p className="text-muted">{selectedTask.description}</p>
          )}
          <p className="text-muted">
            Sessions completed: {selectedTask.sessions_count}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="card">
        <h3>How to Use the Pomodoro Timer</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Select a task you want to work on</li>
          <li>Click "Start Work Session" to begin a 25-minute focused work period</li>
          <li>Stay focused on your task until the timer ends</li>
          <li>Take a 5-minute break when the work session completes</li>
          <li>Repeat the cycle to build momentum and maintain focus</li>
        </ol>
      </div>
    </div>
  );
}

export default PomodoroTimer; 