# Database Setup Guide (Railway)
## Connection Information
- **Provider**: Railway Managed PostgreSQL
- **Connection**: Uses standard PostgreSQL connection string (`DATABASE_URL`).

## Setup Steps
### 1. Get Credentials
1.  Go to your Railway Project Dashboard.
2.  Click on the **PostgreSQL** service card.
3.  Go to the **Connect** tab.
4.  Copy the **PostgreSQL Connection URL** (e.g., `postgresql://postgres:password@round-house.railway.internal:5432/railway`).

### 2. Configure Local Environment
Create or update your `.env` file in the project root:

```bash
# Backend Database Connection
DATABASE_URL="postgresql://postgres:password@round-house.railway.internal:5432/railway"

# Redis Connection (if using Railway Redis)
REDIS_URL="redis://default:password@round-house.railway.internal:6379"
```

### 3. Run Schema & Seeds (Locally)
If you have the `psql` client installed locally, you can initialize the remote database:

```bash
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/seed.sql
```

**Note**: For `psql` to work, use the **Public Networking** URL from Railway (Connect -> Public Networking).

## Verify Setup
```sql
-- Check employees table
SELECT COUNT(*) FROM employees;
```
