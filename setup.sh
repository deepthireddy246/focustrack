#!/bin/bash

echo "🚀 Setting up FocusTrack..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Backend setup
echo "📦 Setting up backend..."
cd backend

# Install Node.js dependencies
echo "Installing backend dependencies..."
npm install

echo "✅ Backend setup complete!"

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend

# Install Node.js dependencies
echo "Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete!"

echo ""
echo "🎉 FocusTrack setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend server:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Open your browser and go to: http://localhost:3000"
echo ""
echo "Happy focusing! 🎯" 