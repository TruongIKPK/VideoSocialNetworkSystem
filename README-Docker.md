# Docker Setup for Video Social Network Application

This document provides comprehensive instructions for setting up and running the Video Social Network application using Docker.

## Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- 4GB+ available RAM
- 10GB+ available disk space

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Create environment configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration (especially Cloudinary credentials).

3. **Build and start the application**
   ```bash
   # For development
   ./docker/scripts/build.sh
   ./docker/scripts/deploy.sh development
   
   # For production
   ./docker/scripts/deploy.sh production
   ```

4. **Access the application**
   - Development: http://localhost:3000
   - Production: http://localhost (via Nginx)

## Environment Configuration

### Required Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Cloudinary (Required for media storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Database passwords (Change in production!)
MONGO_ROOT_PASSWORD=secure_password_here
REDIS_PASSWORD=secure_redis_password
```

### Optional Environment Variables

See `.env.example` for all available configuration options.

## Services Architecture

The application consists of the following services:

### Core Services

- **app**: Next.js application (port 3000)
- **mongo-db**: MongoDB database (port 27017) 
- **redis-cache**: Redis cache (port 6379)
- **nginx**: Reverse proxy (ports 80/443) - Production only

### Service Dependencies

```
nginx → app → mongo-db
        ↓
    redis-cache
```

## Development vs Production

### Development Mode

- Hot reload enabled
- Source code mounted as volume
- Debug port (9229) exposed
- Direct access to app (port 3000)
- All ports exposed for debugging

```bash
./docker/scripts/deploy.sh development
```

### Production Mode

- Optimized builds
- Resource limits enforced
- Security-focused configuration
- Access through Nginx only
- SSL support ready
- Logging optimization

```bash
./docker/scripts/deploy.sh production
```

## Docker Commands

### Build and Deploy

```bash
# Build Docker images
./docker/scripts/build.sh

# Deploy development environment
./docker/scripts/deploy.sh development

# Deploy production environment  
./docker/scripts/deploy.sh production

# Clean up everything
./docker/scripts/cleanup.sh
```

### Manual Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Access container shell
docker-compose exec app sh
docker-compose exec mongo-db mongosh
```

## Persistent Data

Data is persisted using Docker volumes:

- **mongodb-data**: MongoDB database files
- **redis-data**: Redis persistence files  
- **app-uploads**: User uploaded files
- **nginx-logs**: Nginx access/error logs

### Backup Data

```bash
# Backup MongoDB
docker-compose exec mongo-db mongodump --out /data/backup

# Backup volumes
docker run --rm -v videosocialnetworksystem_mongodb-data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz /data
```

## Health Checks

All services include health checks:

- **Application**: `GET /api/health`
- **MongoDB**: `mongosh --eval "db.adminCommand('ping')"`
- **Redis**: `redis-cli ping`
- **Nginx**: `nginx -t`

Check health status:
```bash
docker-compose ps
curl http://localhost:3000/api/health
```

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mongo-db

# Follow recent logs
docker-compose logs --tail=50 -f
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Networking

### Internal Network

Services communicate on the `video-social-network` bridge network:
- Subnet: 172.20.0.0/16
- Internal DNS resolution enabled

### Port Mapping

| Service | Internal Port | External Port (Dev) | External Port (Prod) |
|---------|---------------|-------------------|-------------------|
| app     | 3000          | 3000              | - (via nginx)     |
| mongo-db| 27017         | 27017             | -                 |
| redis   | 6379          | 6379              | -                 |
| nginx   | 80/443        | -                 | 80/443            |

## Security Considerations

### Production Security

- Non-root user in containers
- Resource limits enforced
- Network isolation
- Secrets management via environment variables
- Regular security updates

### Passwords and Secrets

Never commit sensitive data:
- Change default passwords in `.env`
- Use strong passwords (16+ characters)
- Consider Docker secrets for production
- Regular credential rotation

## Troubleshooting

### Common Issues

1. **Build fails with permission errors**
   ```bash
   sudo chmod +x docker/scripts/*.sh
   ```

2. **Services won't start**
   ```bash
   docker-compose down --volumes
   docker system prune -a
   ./docker/scripts/build.sh
   ```

3. **Database connection fails**
   - Check MongoDB service health
   - Verify environment variables
   - Check network connectivity

4. **Out of disk space**
   ```bash
   docker system prune -a --volumes
   ```

### Debug Commands

```bash
# Check service status
docker-compose ps

# Check resource usage
docker stats

# Test database connection
docker-compose exec mongo-db mongosh video_social_db

# Test Redis connection
docker-compose exec redis-cache redis-cli ping

# Check application logs
docker-compose logs app | tail -50
```

### Performance Tuning

For production environments:

1. **Increase resource limits** in `docker-compose.prod.yml`
2. **Optimize MongoDB** configuration in `docker/mongodb/mongod.conf`
3. **Configure Redis** memory limits in `docker/redis/redis.conf`
4. **Tune Nginx** worker processes based on CPU cores

## Maintenance

### Regular Tasks

- Monitor disk usage and clean up old images
- Update base images regularly
- Backup data volumes
- Review and rotate secrets
- Monitor application logs

### Updates

```bash
# Update base images
docker-compose pull

# Rebuild with new images
docker-compose up --build -d
```

## Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Test connectivity: Health check endpoints
4. Review this documentation

---

**Note**: This setup is optimized for the Next.js Video Social Network application. Adjust configuration based on your specific requirements and infrastructure.