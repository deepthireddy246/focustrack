const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'focustrack.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tasks table
      db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Sessions table
      db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        session_type TEXT NOT NULL,
        duration INTEGER NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks (id)
      )`, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY || 'jwt-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const result = await new Promise((resolve, reject) => {
      db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', 
        [username, email, passwordHash], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
    });

    // Create JWT token
    const token = jwt.sign({ id: result.lastID }, process.env.JWT_SECRET_KEY || 'jwt-secret-key', { expiresIn: '24h' });

    res.status(201).json({
      message: 'User created successfully',
      access_token: token,
      user: {
        id: result.lastID,
        username,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  try {
    // Find user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY || 'jwt-secret-key', { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Task routes
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, 
               COUNT(CASE WHEN s.session_type = 'work' THEN 1 END) as sessions_count
        FROM tasks t
        LEFT JOIN sessions s ON t.id = s.task_id
        WHERE t.user_id = ?
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `, [req.user.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      db.run('INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)', 
        [title, description || '', req.user.id], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
    });

    const newTask = {
      id: result.lastID,
      title,
      description: description || '',
      completed: false,
      created_at: new Date().toISOString(),
      sessions_count: 0
    };

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const taskId = req.params.id;
  const { title, description, completed } = req.body;

  try {
    // Verify task belongs to user
    const task = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task
    await new Promise((resolve, reject) => {
      const updates = [];
      const values = [];
      
      if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (completed !== undefined) {
        updates.push('completed = ?');
        values.push(completed ? 1 : 0);
      }
      
      values.push(taskId);
      
      db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get updated task with session count
    const updatedTask = await new Promise((resolve, reject) => {
      db.get(`
        SELECT t.*, 
               COUNT(CASE WHEN s.session_type = 'work' THEN 1 END) as sessions_count
        FROM tasks t
        LEFT JOIN sessions s ON t.id = s.task_id
        WHERE t.id = ?
        GROUP BY t.id
      `, [taskId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  const taskId = req.params.id;

  try {
    // Verify task belongs to user
    const task = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete task (sessions will be deleted due to foreign key cascade)
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE id = ?', [taskId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Session routes
app.post('/api/sessions', authenticateToken, async (req, res) => {
  const { task_id, session_type, duration } = req.body;

  if (!task_id || !session_type || !duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify task belongs to user
    const task = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [task_id, req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Create session
    const result = await new Promise((resolve, reject) => {
      db.run('INSERT INTO sessions (task_id, session_type, duration) VALUES (?, ?, ?)', 
        [task_id, session_type, duration], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
    });

    const newSession = {
      id: result.lastID,
      task_id,
      session_type,
      duration,
      completed_at: new Date().toISOString()
    };

    res.status(201).json(newSession);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sessions/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get today's sessions
    const sessions = await new Promise((resolve, reject) => {
      db.all(`
        SELECT s.*, t.title
        FROM sessions s
        JOIN tasks t ON s.task_id = t.id
        WHERE t.user_id = ? AND DATE(s.completed_at) = ?
      `, [req.user.id, today], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Calculate stats
    const totalWorkSessions = sessions.filter(s => s.session_type === 'work').length;
    const totalBreakSessions = sessions.filter(s => s.session_type === 'break').length;
    const totalWorkTime = sessions.filter(s => s.session_type === 'work').reduce((sum, s) => sum + s.duration, 0);
    const totalBreakTime = sessions.filter(s => s.session_type === 'break').reduce((sum, s) => sum + s.duration, 0);

    // Get top tasks
    const topTasks = await new Promise((resolve, reject) => {
      db.all(`
        SELECT t.title, COUNT(s.id) as sessions
        FROM tasks t
        JOIN sessions s ON t.id = s.task_id
        WHERE t.user_id = ? AND DATE(s.completed_at) = ? AND s.session_type = 'work'
        GROUP BY t.id, t.title
        ORDER BY sessions DESC
        LIMIT 5
      `, [req.user.id, today], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      date: today,
      total_work_sessions: totalWorkSessions,
      total_break_sessions: totalBreakSessions,
      total_work_time: totalWorkTime,
      total_break_time: totalBreakTime,
      top_tasks: topTasks
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize database and start server
initDatabase()
  .then(() => {
    console.log('Database initialized successfully!');
    app.listen(PORT, () => {
      console.log(`🚀 FocusTrack backend server running on port ${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }); 