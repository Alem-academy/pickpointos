# Cloud SQL Connection Troubleshooting

## Issue
Connection to Cloud SQL instance `pvz-analytics-db` (34.38.28.82) is timing out.

## Possible Causes
1. **IP not whitelisted** - Your local IP is not in Authorized Networks
2. **Public IP disabled** - Instance doesn't have public IP enabled
3. **Firewall blocking** - Port 5432 is blocked

## Solutions

### Option 1: Add Your IP to Authorized Networks
1. Go to Google Cloud Console
2. Navigate to SQL → `pvz-analytics-db`
3. Click "Connections" → "Networking"
4. Under "Authorized networks", click "Add network"
5. Add your current IP or `0.0.0.0/0` (for testing only!)
6. Save

### Option 2: Use Cloud Shell (Recommended)
```bash
# In Google Cloud Console, open Cloud Shell
gcloud sql connect pvz-analytics-db --user=postgres --database=postgres

# Enter password: Gonduras1@

# Run schema
\i schema.sql

# Run seed
\i seed.sql
```

### Option 3: Use Cloud SQL Proxy with Service Account
1. Download service account key JSON
2. Set environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```
3. Run proxy:
```bash
If connecting locally, ensure you are using the public TCP link from Railway (found in Connect -> Public Networking).
```bash
psql postgres://...
```
```
4. Connect locally:
```bash
psql "host=127.0.0.1 port=5432 dbname=postgres user=postgres password=Gonduras1@"
```

## Verify Connection
Once connected, verify tables:
```sql
\dt
SELECT COUNT(*) FROM employees;
```
