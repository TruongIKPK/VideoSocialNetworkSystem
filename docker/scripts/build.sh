#!/bin/bash

# Build script for Video Social Network Application
set -e

echo "🚀 Building Video Social Network Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        print_warning "No .env.example found. Please create .env file manually."
    fi
fi

# Build the application
print_status "Building Docker images..."
docker-compose build --no-cache

print_status "Removing dangling images..."
docker image prune -f

print_status "Build completed successfully! 🎉"
print_status "Run 'docker-compose up' to start the application."

# Show image sizes
print_status "Docker images:"
docker images | grep -E "(video-social|mongo|redis|nginx)"