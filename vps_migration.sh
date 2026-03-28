#!/bin/bash
set -e

echo "=== Checking Memory & Swap ==="
if ! grep -q swapfile /proc/swaps; then
    echo "Creating 2GB swap file..."
    dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
    echo "Swap created:"
    free -h
else
    echo "Swapfile already exists."
fi

echo "=== Stopping Docker Container ==="
cd /home/centos/sigex-gateway
docker compose down || true

echo "=== Pulling latest changes ==="
echo "=== Code is already up to date via tarball ==="

echo "=== Checking Node ==="
if ! command -v node &> /dev/null; then
    echo "Node is not installed globally! Fixing..."
    # As per CentOS 9 stream
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi

echo "=== Installing dependencies ==="
npm install

echo "=== Creating systemd service ==="
cat << "SERVICE_EOF" > /etc/systemd/system/sigex-gateway.service
[Unit]
Description=Sigex Gateway Service
Documentation=https://github.com/Alem-academy/pickpointos
After=network.target

[Service]
Type=simple
User=centos
Group=centos
WorkingDirectory=/home/centos/sigex-gateway

Environment=NODE_ENV=production
Environment=PORT=8080
Environment=SIGEX_API_URL=https://sigex.kz/api
Environment=NODE_OPTIONS="--max-old-space-size=2048"

ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StartLimitInterval=200
StartLimitBurst=5

NoNewPrivileges=true
PrivateTmp=true

StandardOutput=journal
StandardError=journal
SyslogIdentifier=sigex-gateway

[Install]
WantedBy=multi-user.target
SERVICE_EOF

echo "=== Reloading systemd and restarting ==="
systemctl daemon-reload
systemctl enable sigex-gateway
systemctl restart sigex-gateway

echo "=== Wait for 5s ==="
sleep 5
systemctl status sigex-gateway --no-pager
echo "=== Health check ==="
curl -f http://localhost:8080/health || echo "Health check failed."
