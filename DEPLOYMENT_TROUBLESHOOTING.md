# Deployment Troubleshooting Guide

## 502 Bad Gateway Error

A 502 error means the frontend is working, but the backend API is failing to respond.

### Quick Diagnosis

SSH into your server and run these commands:

```bash
# Check if containers are running
docker ps | grep meeting-summary

# Check backend logs
docker logs meeting-summary-backend --tail 50

# Check frontend logs
docker logs meeting-summary-frontend --tail 50
```

### Common Causes

#### 1. Missing `.env` file on server

The backend **requires** a `.env` file at `/srv/apps/meeting-summary/.env` with:

```env
# REQUIRED: MongoDB connection
MONGODB_URI=mongodb://user:password@host:27017/meeting_app?authSource=admin

# REQUIRED: JWT Secret
JWT_SECRET=your_secure_random_string_here

# Optional: Google Sheets (if migrating data)
GOOGLE_SHEETS_SOURCE_SPREADSHEET_ID=your_id
GOOGLE_SHEETS_TARGET_SPREADSHEET_ID=your_id
GOOGLE_SHEETS_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### 2. Backend container crashing

If `docker ps` shows the backend is NOT running, check logs:

```bash
docker logs meeting-summary-backend
```

Look for errors like:
- `ERROR: MONGODB_URI is not set in .env file`
- `Failed to connect to MongoDB`
- `ECONNREFUSED` (MongoDB not accessible)

### Fix Steps

#### Step 1: Create/Update `.env` file on server

```bash
ssh user@your-server
cd /srv/apps/meeting-summary
nano .env
```

Add the required environment variables (see above).

#### Step 2: Ensure MongoDB is accessible

If using the `infra` network with a MongoDB container:

```bash
# Check if MongoDB is running
docker ps | grep mongo

# Test connection from backend container
docker exec meeting-summary-backend ping mongodb -c 2
```

If MongoDB is in the `infra` network, the `MONGODB_URI` should use the container name:

```env
MONGODB_URI=mongodb://mongodb:27017/meeting_app
```

Or if MongoDB has authentication:

```env
MONGODB_URI=mongodb://username:password@mongodb:27017/meeting_app?authSource=admin
```

#### Step 3: Restart containers

```bash
cd /srv/apps/meeting-summary
docker compose down
docker compose up -d
```

#### Step 4: Verify backend is healthy

```bash
# Check if backend responds
curl http://localhost:3001/health

# Should return: {"status":"ok","message":"Meeting Summary API is running","mongodb":"connected"}
```

### Network Configuration

The backend needs to be on the `infra` network to access MongoDB:

```yaml
services:
  backend:
    networks:
      - web       # For Traefik
      - infra     # For MongoDB access
      - meeting-summary-internal  # For frontend communication
```

### Still Not Working?

1. **Check Traefik logs**:
   ```bash
   docker logs traefik --tail 100
   ```

2. **Verify DNS/SSL**:
   ```bash
   curl -I https://meeting.wisdommlpe.site
   curl -I https://meeting.wisdommlpe.site/api/health
   ```

3. **Check if port 3001 is listening**:
   ```bash
   docker exec meeting-summary-backend netstat -tulpn | grep 3001
   ```
