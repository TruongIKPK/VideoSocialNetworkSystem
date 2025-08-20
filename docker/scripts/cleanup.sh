#!/bin/bash

# Cleanup script for Video Social Network Application
set -e

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

echo "🧹 Cleaning up Video Social Network Application..."

# Ask for confirmation
read -p "This will remove all containers, images, and volumes. Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Cleanup cancelled."
    exit 0
fi

# Stop all containers
print_status "Stopping all containers..."
docker-compose down --remove-orphans

# Remove containers
print_status "Removing containers..."
docker container rm -f $(docker container ls -aq --filter "name=video-social") 2>/dev/null || true

# Remove images
print_status "Removing images..."
docker rmi $(docker images --filter "reference=*video-social*" -q) 2>/dev/null || true

# Remove volumes (ask for confirmation)
read -p "Do you want to remove volumes (this will delete all data)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Removing volumes..."
    docker volume rm $(docker volume ls --filter "name=videosocialnetworksystem" -q) 2>/dev/null || true
else
    print_status "Volumes preserved."
fi

# Remove networks
print_status "Removing networks..."
docker network rm videosocialnetworksystem_video-social-network 2>/dev/null || true

# Remove dangling images and containers
print_status "Cleaning up dangling resources..."
docker system prune -f

print_status "✅ Cleanup completed!"
print_status "Run './docker/scripts/build.sh && ./docker/scripts/deploy.sh' to redeploy the application."