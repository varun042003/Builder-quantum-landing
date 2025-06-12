#!/bin/bash

echo "🚀 Starting BillScan Pro Backend Server"
echo "======================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Navigate to server directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p uploads exports

echo "🔍 Server configuration:"
echo "   - Port: 3001"
echo "   - OCR Engine: Tesseract.js"
echo "   - File Upload Limit: 10MB"
echo "   - Supported Formats: JPG, PNG, WEBP, BMP, TIFF"
echo "   - Export Format: Excel (.xlsx)"

echo ""
echo "🌐 Starting server..."
echo "   Backend will be available at: http://localhost:3001"
echo "   API endpoints: http://localhost:3001/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
