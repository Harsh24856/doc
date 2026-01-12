#!/bin/bash

# Local development script for ML Service
# This script runs the service locally using the virtual environment

cd "$(dirname "$0")"

echo "🚀 Starting ML Service locally..."
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Creating virtual environment with Python 3.11..."
    python3.11 -m venv venv
    echo "Installing dependencies..."
    ./venv/bin/pip install --upgrade pip
    ./venv/bin/pip install -r requirements.txt
fi

# Activate venv and run
echo "✅ Using virtual environment: $(./venv/bin/python --version)"
echo "📦 Starting FastAPI server on http://localhost:8001"
echo ""

./venv/bin/uvicorn app:app --host 0.0.0.0 --port 8001 --reload

