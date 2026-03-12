# Database Restore Instructions

## Current Status
- Remote DB (34.38.28.82) unreachable
- No local Docker/PostgreSQL

## Quick Start

1. Install Supabase CLI:
   brew install supabase/tap/supabase

2. Initialize:
   supabase init

3. Start local DB:
   supabase start

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

## SQL File Ready
- database/combined.sql (342 lines)
