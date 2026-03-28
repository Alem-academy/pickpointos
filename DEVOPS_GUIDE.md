# 🚀 PickPoint OS - DevOps Guide

**Version:** 1.0  
**Last Updated:** 2026-03-27  
**Maintained By:** Development Team

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Infrastructure](#infrastructure)
3. [Deployment](#deployment)
4. [Configuration](#configuration)
5. [Monitoring](#monitoring)
6. [Backup & Recovery](#backup--recovery)
7. [Troubleshooting](#troubleshooting)
8. [Security](#security)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Users (HR, Employees)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS (443)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Railway.app (Production)                       │
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │   Frontend       │      │   Backend API    │            │
│  │   React + Vite   │◄────►│   Node.js        │            │
│  │   (Static)       │      │   Express        │            │
│  └──────────────────┘      └──────────────────┘            │
│                              │                              │
│                              │ PostgreSQL                   │
│                              ▼                              │
│                     ┌──────────────────┐                    │
│                     │   PostgreSQL DB  │                    │
│                     │   (Railway)      │                    │
│                     └──────────────────┘                    │
│                              │                              │
│                              │ S3                           │
│                              ▼                              │
│                     ┌──────────────────┐                    │
│                     │   Cloudflare R2  │                    │
│                     │   (Documents)    │                    │
│                     └──────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS (8080)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Sigex Gateway (VPS)                            │
│              195.49.215.116 (CentOS 9)                      │
│              4 CPU / 4 GB RAM / 80 GB Disk                  │
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │   Sigex Gateway  │◄────►│   Sigex.kz API   │            │
│  │   Node.js        │      │   (eGov)         │            │
│  │   Port 8080      │      │   (External)     │            │
│  └──────────────────┘      └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Infrastructure

### Production Environment

| Component | Provider | Configuration | Cost |
|-----------|----------|---------------|------|
| **Frontend + Backend** | Railway.app | Standard Plan | $5/mo |
| **PostgreSQL** | Railway.app | Included | Included |
| **Object Storage** | Cloudflare R2 | 10 GB free | Free |
| **Sigex Gateway** | VPS | 4 CPU / 4 GB RAM | ~$10/mo |
| **Domain** | Custom | gateway.pvz.kz | ~$10/yr |

### Network Configuration

**Railway:**
- Domain: `pickpointos-production.up.railway.app`
- Port: 8080 (auto-assigned)
- SSL: Automatic (Let's Encrypt)

**Gateway VPS:**
- IP: `195.49.215.116`
- IPv6: `2a00:5da0:1000:1::3147`
- Domain: `gateway.pvz.kz`
- Port: 8080
- SSL: Manual (Certbot)

---

## 🚀 Deployment

### Frontend + Backend (Railway)

**Automatic Deployment:**
```bash
# 1. Push to main branch
git add -A
git commit -m "feat: your changes

Co-authored-by: Qwen-Coder <qwen-coder@alibabacloud.com>"
git push origin main

# 2. Railway auto-deploys
# Check status at: https://railway.app/dashboard
```

**Manual Deployment:**
```bash
# 1. Build locally
npm run build

# 2. Test locally
npm run preview

# 3. Push to Railway
git push railway main
```

**Environment Variables (Railway):**
```bash
# Add in Railway Dashboard → Variables

# Database
DATABASE_URL=postgresql://user:pass@host:5432/railway

# S3 Storage (Cloudflare R2)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_ENDPOINT=https://account-id.r2.cloudflarestorage.com
AWS_BUCKET_NAME=pickpointos
AWS_REGION=auto

# Frontend URL
FRONTEND_URL=https://pickpointos-production.up.railway.app

# Sigex Gateway
VITE_SIGEX_GATEWAY_URL=https://gateway.pvz.kz
```

### Sigex Gateway (VPS)

**Manual Deployment:**
```bash
# 1. SSH to server
ssh centos@195.49.215.116

# 2. Navigate to app directory
cd /home/centos/sigex-gateway

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies
npm install

# 5. Build (if needed)
npm run build

# 6. Restart service
sudo systemctl restart sigex-gateway

# 7. Check status
sudo systemctl status sigex-gateway
```

**Service File:**
```ini
# /etc/systemd/system/sigex-gateway.service

[Unit]
Description=Sigex Gateway Service
Documentation=https://github.com/Alem-academy/pickpointos
After=network.target

[Service]
Type=simple
User=centos
Group=centos
WorkingDirectory=/home/centos/sigex-gateway

# Environment Variables
Environment=NODE_ENV=production
Environment=PORT=8080
Environment=SIGEX_API_URL=https://sigex.kz/api
Environment=NODE_OPTIONS=--max-old-space-size=512

# Process Management
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StartLimitInterval=200
StartLimitBurst=5

# Security
NoNewPrivileges=true
PrivateTmp=true

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sigex-gateway

[Install]
WantedBy=multi-user.target
```

---

## ⚙️ Configuration

### Database Migrations

**Apply Migrations:**
```bash
# Connect to database
psql $DATABASE_URL

# Run migration file
\i database/migrations/012_add_document_signing_links.sql

# Verify
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'document_signing_links'
);
```

**Migration Checklist:**
- [ ] Backup database
- [ ] Test migration on staging
- [ ] Apply to production
- [ ] Verify tables created
- [ ] Test functionality

### Environment Variables

**Frontend (.env.production):**
```bash
VITE_API_URL=https://pickpointos-production.up.railway.app
VITE_SIGEX_GATEWAY_URL=https://gateway.pvz.kz
```

**Backend (Railway Variables):**
```bash
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT=...
AWS_BUCKET_NAME=pickpointos
FRONTEND_URL=https://pickpointos-production.up.railway.app
```

**Gateway (/etc/systemd/system/sigex-gateway.service):**
```bash
PORT=8080
SIGEX_API_URL=https://sigex.kz/api
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=512
```

---

## 📊 Monitoring

### Health Checks

**Backend:**
```bash
curl https://pickpointos-production.up.railway.app/health
# Expected: OK
```

**Gateway:**
```bash
curl https://gateway.pvz.kz/health
# Expected: {"status":"ok","service":"sigex-gateway"}
```

**Database:**
```bash
psql $DATABASE_URL -c "SELECT 1"
# Expected: 1
```

### Logs

**Railway:**
```bash
# View in Railway Dashboard → Deployments → Logs
# Or use Railway CLI
railway logs
```

**Gateway:**
```bash
# Systemd logs
sudo journalctl -u sigex-gateway -n 100 --no-pager

# Real-time
sudo journalctl -u sigex-gateway -f

# Error logs only
sudo journalctl -u sigex-gateway -p err
```

### Metrics to Monitor

| Metric | Threshold | Alert |
|--------|-----------|-------|
| **Response Time** | < 500ms | > 1000ms |
| **Error Rate** | < 1% | > 5% |
| **Memory Usage** | < 80% | > 90% |
| **Disk Usage** | < 80% | > 90% |
| **CPU Usage** | < 80% | > 90% |

### Cron Jobs

**Gateway Health Check:**
```bash
# Add to crontab
crontab -e

# Check every 5 minutes
*/5 * * * * curl -f https://gateway.pvz.kz/health || sudo systemctl restart sigex-gateway
```

---

## 💾 Backup & Recovery

### Database Backup

**Automatic (Railway):**
- Railway creates daily backups automatically
- Retention: 7 days
- Restore via Railway Dashboard

**Manual:**
```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20260327.sql
```

### S3 Backup (Cloudflare R2)

**Backup Script:**
```bash
#!/bin/bash
# backup-r2.sh

BUCKET="pickpointos"
BACKUP_DIR="/backup/r2"
DATE=$(date +%Y%m%d)

# Create backup directory
mkdir -p $BACKUP_DIR

# Download all files
aws s3 cp s3://$BUCKET/ $BACKUP_DIR/$DATE/ --recursive

# Compress
tar -czf $BACKUP_DIR/$DATE.tar.gz $BACKUP_DIR/$DATE/

# Upload to cold storage (optional)
aws s3 cp $BACKUP_DIR/$DATE.tar.gz s3://cold-storage/$DATE.tar.gz
```

### Recovery Procedure

**1. Database Recovery:**
```bash
# 1. Stop application
# 2. Restore from backup
psql $DATABASE_URL < backup-20260327.sql
# 3. Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM employees"
# 4. Restart application
```

**2. Gateway Recovery:**
```bash
# 1. SSH to server
ssh centos@195.49.215.116

# 2. Stop service
sudo systemctl stop sigex-gateway

# 3. Restore from backup
tar -xzf backup-20260327.tar.gz -C /home/centos/sigex-gateway/

# 4. Restart service
sudo systemctl start sigex-gateway
```

---

## 🐛 Troubleshooting

### Issue 1: Gateway Timeout

**Symptoms:**
```
ERR_TIMED_OUT
504 Gateway Timeout
```

**Solution:**
```bash
# 1. SSH to gateway
ssh centos@195.49.215.116

# 2. Check service
sudo systemctl status sigex-gateway

# 3. Check logs
sudo journalctl -u sigex-gateway -n 50

# 4. Restart if needed
sudo systemctl restart sigex-gateway

# 5. Test
curl http://localhost:8080/health
```

### Issue 2: Out of Memory

**Symptoms:**
```
Killed
npm ERR! code ELIFECYCLE
```

**Solution:**
```bash
# Check memory
free -h

# Clear cache
sync; echo 3 > /proc/sys/vm/drop_caches

# Restart service
sudo systemctl restart sigex-gateway

# Add swap if needed (4 GB RAM should be enough)
```

### Issue 3: Database Connection Failed

**Symptoms:**
```
ECONNREFUSED
database "railway" does not exist
```

**Solution:**
```bash
# 1. Check DATABASE_URL in Railway Dashboard
# 2. Verify connection
psql $DATABASE_URL -c "SELECT 1"

# 3. If failed, restore from backup
# 4. Contact Railway support if needed
```

### Issue 4: S3 Upload Failed

**Symptoms:**
```
AccessDenied
InvalidAccessKeyId
```

**Solution:**
```bash
# 1. Check AWS credentials in Railway Variables
# 2. Verify bucket exists
aws s3 ls s3://pickpointos

# 3. Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://pickpointos/test.txt

# 4. Check Cloudflare R2 dashboard
```

---

## 🔒 Security

### Firewall Configuration

**Gateway VPS:**
```bash
# Open required ports
sudo firewall-cmd --permanent --add-port=22/tcp    # SSH
sudo firewall-cmd --permanent --add-port=80/tcp    # HTTP
sudo firewall-cmd --permanent --add-port=443/tcp   # HTTPS
sudo firewall-cmd --permanent --add-port=8080/tcp  # Gateway

# Reload
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-ports
```

### SSH Hardening

**Edit `/etc/ssh/sshd_config`:**
```bash
# Disable root login
PermitRootLogin no

# Use key-based auth
PasswordAuthentication no
PubkeyAuthentication yes

# Change port (optional)
Port 2222

# Restart SSH
sudo systemctl restart sshd
```

### SSL/TLS

**Gateway (Certbot):**
```bash
# Install Certbot
sudo dnf install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --standalone -d gateway.pvz.kz

# Auto-renewal (cron)
0 0 1 * * certbot renew --quiet
```

### Secrets Management

**Never commit:**
- ❌ Passwords
- ❌ API keys
- ❌ Database URLs
- ❌ AWS credentials

**Use:**
- ✅ Railway Variables
- ✅ Environment files (.env)
- ✅ systemd Environment=

---

## 📞 Support Contacts

| Issue | Contact | Method |
|-------|---------|--------|
| **Railway Issues** | Railway Support | support@railway.app |
| **Cloudflare R2** | Cloudflare Dashboard | Dashboard → Support |
| **Gateway VPS** | Hosting Provider | Support Ticket |
| **Sigex API** | Sigex Support | support@sigex.kz |
| **Development** | Dev Team | GitHub Issues |

---

## 📝 Deployment Checklist

### Pre-Deploy

- [ ] Code reviewed
- [ ] Tests passed
- [ ] Migrations tested on staging
- [ ] Environment variables updated
- [ ] Backup created

### Deploy

- [ ] Push to main branch
- [ ] Railway auto-deploys
- [ ] Monitor build logs
- [ ] Check health endpoint
- [ ] Test critical features

### Post-Deploy

- [ ] Smoke tests passed
- [ ] No errors in logs
- [ ] Metrics normal
- [ ] Users can access
- [ ] Documents generate
- [ ] Signing works

---

## 🎯 Quick Reference

### Common Commands

```bash
# Railway
railway login
railway logs
railway deploy

# Gateway
ssh centos@195.49.215.116
sudo systemctl status sigex-gateway
sudo journalctl -u sigex-gateway -f

# Database
psql $DATABASE_URL
pg_dump $DATABASE_URL > backup.sql

# S3
aws s3 ls s3://pickpointos
aws s3 cp file.txt s3://pickpointos/
```

### Useful URLs

- **Railway Dashboard:** https://railway.app/dashboard
- **Cloudflare R2:** https://dash.cloudflare.com/
- **Sigex API:** https://sigex.kz/api
- **Gateway Health:** https://gateway.pvz.kz/health

---

**Document Version:** 1.0  
**Created:** 2026-03-27  
**Next Review:** 2026-04-27  
**Maintained By:** DevOps Team
