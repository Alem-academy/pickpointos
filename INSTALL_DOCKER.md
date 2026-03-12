# Docker Desktop Installation

## Status
✅ Homebrew installed
✅ Supabase CLI installed  
❌ Docker Desktop needed

## Install

1. Install Docker Desktop:
   arch -arm64 /opt/homebrew/bin/brew install --cask docker
   
   OR download: https://desktop.docker.com/mac/main/arm64/Docker.dmg

2. Start Docker:
   open -a Docker
   
   Wait for green icon ✅

3. Start Supabase:
   cd /Users/mac/Documents/AlemLab-pickpointoperations
   arch -arm64 /opt/homebrew/bin/supabase start

4. Import data:
   psql postgresql://postgres:postgres@localhost:54322/postgres < database/combined.sql

5. Create .env:
   DB_HOST=localhost
   DB_PORT=54322
   DB_USER=postgres
   DB_PASSWORD=postgres

6. Restart backend:
   npm start

## Test
- curl http://localhost:8080/health
- Login: madina.kimadi.1994@gmail.com / password123
