# 🔧 Sigex Gateway Operations Manual

**Server:** gateway.pvz.kz  
**IP:** 195.49.215.116  
**OS:** CentOS 9-stream  
**Configuration:** 4 CPU / 4 GB RAM / 80 GB Disk ✅ **UPGRADED**  
**Date:** 2026-03-27

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Diagnostics](#diagnostics)
3. [Common Issues](#common-issues)
4. [Configuration](#configuration)
5. [Monitoring](#monitoring)
6. [Backup & Recovery](#backup--recovery)

---

## 🚀 Quick Start

### Connect to Server

```bash
ssh centos@195.49.215.116
# Password: [REDACTED - use secure password manager]
sudo -i  # Get root privileges
```

### Check Service Status

```bash
# Check if gateway is running
systemctl status sigex-gateway

# If not running, start it
systemctl start sigex-gateway
systemctl enable sigex-gateway  # Auto-start on boot
```

### Test Health

```bash
# Local test
curl http://localhost:8080/health

# External test
curl https://gateway.pvz.kz/health
```

---

## 🔍 Diagnostics

### 1. Service Status

```bash
# Check systemd service
systemctl status sigex-gateway
systemctl is-active sigex-gateway
systemctl is-enabled sigex-gateway

# Check process
ps aux | grep node
ps aux | grep sigex

# Check port
netstat -tlnp | grep 8080
ss -tlnp | grep 8080
```

### 2. Logs

```bash
# Systemd logs (last 100 lines)
journalctl -u sigex-gateway -n 100 --no-pager

# Follow logs in real-time
journalctl -u sigex-gateway -f

# Logs from today
journalctl -u sigex-gateway --since today

# Error logs only
journalctl -u sigex-gateway -p err
```

### 3. Network

```bash
# Check DNS resolution
nslookup sigex.kz
dig sigex.kz

# Test connectivity to sigex.kz
curl -I https://sigex.kz/api
ping -c 4 sigex.kz

# Check firewall
firewall-cmd --list-all
firewall-cmd --list-ports

# Check listening ports
netstat -tlnp
```

### 4. Resources

```bash
# Memory usage
free -h
top -bn1 | grep "Cpu(s)"

# Disk usage
df -h
du -sh /home/centos/sigex-gateway

# CPU load
uptime
top -bn1 | head -5
```

---

## 🐛 Common Issues

### Issue 1: Service Not Running

**Symptoms:**
```
systemctl status sigex-gateway
● sigex-gateway.service - Sigex Gateway Service
   Active: inactive (dead)
```

**Solution:**
```bash
# Start service
systemctl start sigex-gateway

# Enable auto-start
systemctl enable sigex-gateway

# Verify
systemctl status sigex-gateway
```

---

### Issue 2: SIGEX_API_URL Not Set

**Symptoms:**
```
Error: SIGEX_API_URL is not defined
Cannot connect to sigex.kz
```

**Solution:**
```bash
# Edit service file
vi /etc/systemd/system/sigex-gateway.service

# Add/verify these lines:
[Service]
Environment=PORT=8080
Environment=SIGEX_API_URL=https://sigex.kz/api

# Reload and restart
systemctl daemon-reload
systemctl restart sigex-gateway

# Verify
systemctl cat sigex-gateway | grep SIGEX
```

---

### Issue 3: Firewall Blocking Port

**Symptoms:**
```
curl https://gateway.pvz.kz/health
curl: (7) Failed to connect to gateway.pvz.kz port 443: Connection timed out
```

**Solution:**
```bash
# Open ports
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=8080/tcp

# Reload firewall
firewall-cmd --reload

# Verify
firewall-cmd --list-ports
```

---

### Issue 4: CORS Not Configured

**Symptoms:**
```
Access to fetch at 'https://gateway.pvz.kz' from origin 'https://pickpointos-production.up.railway.app' 
has been blocked by CORS policy
```

**Solution:**
```bash
# Edit gateway source
cd /home/centos/sigex-gateway/src
vi index.js

# Add CORS configuration:
const cors = require('cors');
app.use(cors({
    origin: [
        'https://pickpointos-production.up.railway.app',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

# Restart service
systemctl restart sigex-gateway
```

---

### Issue 5: Memory Exhausted

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

# Restart service (releases memory)
systemctl restart sigex-gateway

# Consider adding swap if needed
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

## ⚙️ Configuration

### Systemd Service File

**Location:** `/etc/systemd/system/sigex-gateway.service`

```ini
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

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | ✅ | `8080` | Gateway listening port |
| `SIGEX_API_URL` | ✅ | - | Sigex API endpoint |
| `NODE_ENV` | - | `production` | Node environment |

---

## 📊 Monitoring

### Health Checks

```bash
# Local health check
curl http://localhost:8080/health

# Expected response:
# {"status":"ok","service":"sigex-gateway","timestamp":"2026-03-27T..."}
```

### Cron Job for Monitoring

```bash
# Add to crontab
crontab -e

# Add this line (check every 5 minutes)
*/5 * * * * curl -f http://localhost:8080/health || systemctl restart sigex-gateway
```

### Log Rotation

```bash
# Create logrotate config
vi /etc/logrotate.d/sigex-gateway

# Content:
/var/log/sigex-gateway/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 centos centos
    postrotate
        systemctl reload sigex-gateway > /dev/null 2>&1 || true
    endscript
}
```

---

## 💾 Backup & Recovery

### Backup Configuration

```bash
# Create backup directory
mkdir -p /backup/sigex-gateway

# Backup service file
cp /etc/systemd/system/sigex-gateway.service /backup/sigex-gateway/

# Backup application
tar -czf /backup/sigex-gateway/app-$(date +%Y%m%d).tar.gz \
    /home/centos/sigex-gateway/

# Backup environment
env | grep SIGEX > /backup/sigex-gateway/env-$(date +%Y%m%d).txt
```

### Recovery

```bash
# Stop service
systemctl stop sigex-gateway

# Restore application
tar -xzf /backup/sigex-gateway/app-20260327.tar.gz -C /

# Restore service file
cp /backup/sigex-gateway/sigex-gateway.service /etc/systemd/system/

# Reload and start
systemctl daemon-reload
systemctl start sigex-gateway
```

---

## 📞 Support Contacts

| Issue | Contact | Method |
|-------|---------|--------|
| Server Access | System Admin | SSH |
| Sigex API Issues | Sigex Support | support@sigex.kz |
| Gateway Code | Development Team | GitHub Issues |
| Network/Firewall | Hosting Provider | Support Ticket |

---

## 📝 Checklist

### Initial Setup
- [ ] SSH access configured
- [ ] Node.js installed (v20+)
- [ ] Application deployed
- [ ] Service file created
- [ ] SIGEX_API_URL set
- [ ] Firewall configured
- [ ] Health check working

### Daily Operations
- [ ] Service is running
- [ ] Health check passes
- [ ] No errors in logs
- [ ] Memory usage < 80%
- [ ] Disk usage < 80%

### Weekly Maintenance
- [ ] Review error logs
- [ ] Check for updates
- [ ] Verify backups
- [ ] Test health endpoint
- [ ] Review access logs

---

## 🎯 Quick Reference

```bash
# Start service
systemctl start sigex-gateway

# Stop service
systemctl stop sigex-gateway

# Restart service
systemctl restart sigex-gateway

# Check status
systemctl status sigex-gateway

# View logs
journalctl -u sigex-gateway -f

# Test health
curl http://localhost:8080/health

# Check memory
free -h

# Check disk
df -h

# Restart after config change
systemctl daemon-reload && systemctl restart sigex-gateway
```

---

**Last Updated:** 2026-03-27  
**Version:** 1.0  
**Maintained By:** PickPoint Operations Team
