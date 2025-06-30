# FocusTrack

A Pomodoro-based task tracker that helps you stay focused and productive. Built with React frontend and Node.js backend.

## Features

- **Task Management**: Add, edit, and delete tasks
- **Pomodoro Timer**: Built-in 25-minute work sessions with 5-minute breaks
- **Session Tracking**: Track completed Pomodoro sessions per task
- **Daily Statistics**: View your productivity metrics
- **User Authentication**: Secure login/signup with JWT
- **Clean UI**: Minimal and intuitive interface

## Tech Stack

- **Frontend**: React, CSS3
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Authentication**: JWT
- **Styling**: Custom CSS with modern design

## Project Structure

```
focustrack/
├── frontend/          # React application
├── backend/           # Node.js API
├── database/          # SQLite database
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Tasks
- `GET /api/tasks` - Get all tasks for user
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/<id>` - Update task
- `DELETE /api/tasks/<id>` - Delete task

### Sessions
- `POST /api/sessions` - Record completed session
- `GET /api/sessions/stats` - Get daily statistics

## Usage

1. Register an account or login
2. Add tasks to your task list
3. Start a Pomodoro session for any task
4. Complete work sessions and breaks
5. View your daily statistics and progress
