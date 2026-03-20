# Self-Hosting Guide

This guide covers different deployment options for self-hosting Apico.

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Railway.app Deployment](#railwayapp-deployment)
3. [Manual VPS Deployment](#manual-vps-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Reverse Proxy Setup](#reverse-proxy-setup)
7. [Security Considerations](#security-considerations)

## Docker Deployment

The easiest way to self-host Apico is using Docker and Docker Compose.

### Prerequisites

- Docker 20.10+
- Docker Compose 1.29+
- 2GB RAM minimum
- 1GB disk space minimum

### Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/apico.git
cd apico
```

2. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` and set:
- `JWT_SECRET` - A strong random string (min 32 characters)
- `JWT_REFRESH_SECRET` - Another strong random string
- `MYSQL_PASSWORD` - Strong MySQL password

3. **Start services**

```bash
docker-compose up -d
```

4. **Verify installation**

```bash
docker-compose logs -f
```

The app should be available at `http://localhost:3000`

### Updating

```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

### Troubleshooting

**MySQL connection failed:**
```bash
docker-compose restart mysql
```

**Out of memory:**
Increase Docker memory limit in Docker Desktop settings.

## Railway.app Deployment

Railway.app provides a simple way to deploy with automatic CI/CD.

### Prerequisites

- Railway.app account
- GitHub account

### Deployment Steps

1. **Fork the repository on GitHub**

2. **Connect GitHub to Railway**
   - Go to railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize and select your fork

3. **Configure services**

Railway should auto-detect both services. Configure variables:

**API Service:**
- `NODE_ENV` = `production`
- `DATABASE_URL` = Railway MySQL connection string
- `JWT_SECRET` = Strong random string
- `JWT_REFRESH_SECRET` = Strong random string
- `PORT` = `5000`

**Web Service:**
- `NEXT_PUBLIC_API_BASE_URL` = Your API URL (e.g., `https://api.yourdomain.com`)

4. **Deploy**

Push to GitHub and Railway will auto-deploy.

### Custom Domain

In Railway:
1. Select your web service
2. Go to "Settings"
3. Add custom domain
4. Update DNS records

## Manual VPS Deployment

For full control, deploy on your own VPS.

### Prerequisites

- VPS with 2GB RAM, 20GB disk
- Ubuntu 20.04+ or CentOS 8+
- sudo access

### Setup Steps

1. **Update system**

```bash
sudo apt update
sudo apt upgrade -y
```

2. **Install Node.js**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

3. **Install MySQL**

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

4. **Create database**

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE apico;
CREATE USER 'apico'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON apico.* TO 'apico'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

5. **Clone and build application**

```bash
cd /home/ubuntu
git clone https://github.com/yourusername/apico.git
cd apico

npm install
cd api && npm install && npm run prisma:migrate
cd ../apps/web && npm install && npm run build
```

6. **Create environment files**

```bash
cd /home/ubuntu/apico

# API .env
cat > api/.env << EOF
DATABASE_URL=mysql://apico:strong_password@localhost:3306/apico
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=5000
EOF

# Web .env
cat > apps/web/.env.local << EOF
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
EOF
```

7. **Setup PM2 for process management**

```bash
sudo npm install -g pm2

# Start API
pm2 start "npm run start" --name "apico-api" --cwd /home/ubuntu/apico/api

# Start Web
pm2 start "npm run start" --name "apico-web" --cwd /home/ubuntu/apico/apps/web

# Save PM2 config
pm2 save
sudo pm2 startup
```

8. **Setup Nginx reverse proxy** (see Reverse Proxy Setup section)

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection | `mysql://user:pass@host/db` |
| `JWT_SECRET` | Access token secret | (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (min 32 chars) |
| `NODE_ENV` | Environment | `production` |
| `PORT` | API port | `5000` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API URL | `https://api.yourdomain.com` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level |
| `JWT_EXPIRATION` | `15m` | Access token expiration |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token expiration |

## Database Setup

### Backup

```bash
mysqldump -u apico -p apico > backup.sql
```

### Restore

```bash
mysql -u apico -p apico < backup.sql
```

### Migration

To update database schema:

```bash
cd api
npm run prisma:migrate
npm run prisma:generate
```

## Reverse Proxy Setup

### Nginx Configuration

```nginx
upstream apico_api {
    server localhost:5000;
}

upstream apico_web {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # API proxy
    location /api/ {
        proxy_pass http://apico_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Web proxy
    location / {
        proxy_pass http://apico_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Certbot for SSL

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, random secrets
   - Rotate secrets periodically

2. **Database Security**
   - Use strong MySQL passwords
   - Restrict MySQL access to localhost
   - Regular backups
   - Enable binary logging for recovery

3. **HTTPS/SSL**
   - Always use HTTPS in production
   - Use Let's Encrypt (free)
   - Keep certificates updated

4. **Firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

5. **Updates**
   - Keep Node.js updated
   - Keep dependencies updated
   - Monitor security advisories

6. **Rate Limiting**
   - Implement rate limiting at reverse proxy level
   - Monitor for abuse

## Monitoring

### Health Checks

```bash
# API health
curl https://api.yourdomain.com/health

# Web health
curl https://yourdomain.com/api/health
```

### Logs

**PM2:**
```bash
pm2 logs
```

**Nginx:**
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Services won't start

Check logs:
```bash
pm2 logs apico-api
pm2 logs apico-web
```

### Database connection error

Verify MySQL is running:
```bash
sudo systemctl status mysql
```

### High memory usage

Increase Node.js heap:
```bash
NODE_OPTIONS="--max_old_space_size=2048" npm start
```

## Support

For issues and questions:
- Check the main README.md
- Review error logs
- Open an issue on GitHub
