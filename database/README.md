# Database Setup Guide

## Connection Information
- **Instance**: `gen-lang-client-0534671855:europe-west1:pvz-analytics-db`
- **Region**: `europe-west1`
- **Database**: `postgres` (default)

## Setup Steps

### 1. Install Cloud SQL Proxy
```bash
brew install cloud-sql-proxy
```

### 2. Start Cloud SQL Proxy
```bash
cloud-sql-proxy gen-lang-client-0534671855:europe-west1:pvz-analytics-db \
  --port 5432
```

### 3. Connect to Database
In a new terminal:
```bash
psql "host=127.0.0.1 port=5432 dbname=postgres user=postgres password=Gonduras1@"
```

### 4. Run Schema
```sql
\i database/schema.sql
```

### 5. Run Seed Data
```sql
\i database/seed.sql
```

## Verify Setup
```sql
-- Check tables
\dt

-- Count employees
SELECT COUNT(*) FROM employees;

-- Count PVZ points
SELECT COUNT(*) FROM pvz_points;

-- Check financial transactions
SELECT pvz_id, type, SUM(amount) as total 
FROM financial_transactions 
GROUP BY pvz_id, type;
```

## Service Account Authentication (Alternative)
If using service account:
```bash
gcloud auth activate-service-account \
  p224662539791-iv185p@gcp-sa-cloud-sql.iam.gserviceaccount.com \
  --key-file=path/to/key.json
```
