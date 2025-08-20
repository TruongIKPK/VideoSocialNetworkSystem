#!/bin/bash

# Deploy script for Video Social Network Application
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Default environment
ENVIRONMENT=${1:-development}

print_header "🚀 Deploying Video Social Network Application in $ENVIRONMENT mode..."

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Usage: $0 [development|production]"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check environment file
if [ ! -f ".env" ]; then
    print_error "No .env file found. Please create one from .env.example"
    exit 1
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Deploying in PRODUCTION mode..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
else
    print_status "Deploying in DEVELOPMENT mode..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
fi

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service health
print_status "Checking service health..."
if [ "$ENVIRONMENT" = "production" ]; then
    SERVICES=("video-social-app-prod" "video-social-mongodb-prod" "video-social-redis-prod" "video-social-nginx-prod")
else
    SERVICES=("video-social-app-dev" "video-social-mongodb-dev" "video-social-redis-dev")
fi

for service in "${SERVICES[@]}"; do
    if docker ps | grep -q "$service"; then
        print_status "✅ $service is running"
    else
        print_error "❌ $service is not running"
    fi
done

# Show logs
print_status "Recent logs:"
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=10
else
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=10
fi

print_header "🎉 Deployment completed!"

if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Application is available at: http://localhost"
else
    print_status "Application is available at: http://localhost:3000"
fi

print_status "To view logs: docker-compose logs -f"
print_status "To stop: docker-compose down"