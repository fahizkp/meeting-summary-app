# Committee Migration - Server Deployment Guide

Since Node.js is not directly available on the server, here are multiple approaches to run the migration:

## Method 1: Using Docker (Recommended)

Your application runs in Docker containers, so we can execute the script inside the backend container.

### Step 1: Upload the Migration Script

```bash
# From your local machine
scp backend/scripts/migrateCommitteeToServer.js user@server:/srv/apps/meeting-summary/backend/scripts/
scp backend/scripts/migrate_committee_docker.sh user@server:/srv/apps/meeting-summary/backend/scripts/
```

### Step 2: SSH to Server and Run

```bash
# SSH to server
ssh user@server

# Navigate to scripts directory
cd /srv/apps/meeting-summary/backend/scripts

# Make the script executable
chmod +x migrate_committee_docker.sh

# Run the migration
./migrate_committee_docker.sh
```

### Alternative Docker Commands

If the bash script doesn't work, use these direct Docker commands:

```bash
# Find your backend container
docker ps | grep backend

# Execute the migration script in the container
docker exec -it <backend-container-name> node scripts/migrateCommitteeToServer.js

# Or using docker-compose
cd /srv/apps/meeting-summary
docker-compose exec backend node scripts/migrateCommitteeToServer.js
```

## Method 2: Using Docker Exec (Direct)

```bash
# SSH to server
ssh user@server

# Navigate to app directory
cd /srv/apps/meeting-summary

# Run migration in backend container
docker-compose exec backend node scripts/migrateCommitteeToServer.js
```

## Method 3: Import Pre-Exported Data

If Google Sheets access isn't working on the server, use the pre-exported data:

### Step 1: Upload Exported Data

```bash
# From your local machine
scp -r backend/scripts/exported_data user@server:/srv/apps/meeting-summary/backend/scripts/
scp backend/scripts/serverImport.js user@server:/srv/apps/meeting-summary/backend/scripts/
```

### Step 2: Run Import via Docker

```bash
# SSH to server
ssh user@server
cd /srv/apps/meeting-summary

# Import the data
docker-compose exec backend node scripts/serverImport.js
```

## Method 4: Using MongoDB Import Tools

If you prefer to use MongoDB's native tools:

### Step 1: Extract Committee Data

On your local machine, create a MongoDB-compatible JSON:

```bash
# Already done - the file is: backend/scripts/exported_data/committees.json
```

### Step 2: Upload to Server

```bash
scp backend/scripts/exported_data/committees.json user@server:/tmp/
```

### Step 3: Import Using mongoimport

```bash
# SSH to server
ssh user@server

# Get MongoDB connection details from .env
cd /srv/apps/meeting-summary/backend
cat .env | grep MONGODB_URI

# Import using mongoimport (if available)
mongoimport --uri="<your-mongodb-uri>" \
  --collection=committees \
  --file=/tmp/committees.json \
  --jsonArray \
  --mode=upsert \
  --upsertFields=committeeId
```

## Method 5: Using Docker with mongoimport

If mongoimport isn't available but Docker is:

```bash
# SSH to server
ssh user@server

# Upload the JSON file to a location accessible by Docker
scp backend/scripts/exported_data/committees.json user@server:/srv/apps/meeting-summary/backend/scripts/exported_data/

# Run mongoimport via Docker
docker run --rm -v /srv/apps/meeting-summary/backend/scripts/exported_data:/data \
  mongo:latest mongoimport \
  --uri="<your-mongodb-uri>" \
  --collection=committees \
  --file=/data/committees.json \
  --jsonArray \
  --mode=upsert \
  --upsertFields=committeeId
```

## Recommended Approach

**Use Method 1 or Method 2** (Docker-based) as they:
- ✅ Work with your existing Docker setup
- ✅ Have access to all dependencies
- ✅ Can fetch from Google Sheets directly
- ✅ Include verification steps

## Quick Reference Commands

### Check if Backend Container is Running
```bash
docker ps | grep backend
# or
docker-compose ps
```

### View Backend Container Logs
```bash
docker-compose logs backend
```

### Access Backend Container Shell
```bash
docker-compose exec backend sh
# or
docker-compose exec backend bash
```

### Run Migration (Simplest)
```bash
cd /srv/apps/meeting-summary
docker-compose exec backend node scripts/migrateCommitteeToServer.js
```

### Verify After Migration
```bash
docker-compose exec backend node scripts/verifyServerData.js
```

## Troubleshooting

### "Backend container not found"
```bash
# Start the backend container
cd /srv/apps/meeting-summary
docker-compose up -d backend

# Verify it's running
docker-compose ps
```

### "Permission denied"
```bash
# Make scripts executable
chmod +x backend/scripts/*.sh
```

### "Google Sheets access denied"
- Use Method 3 (pre-exported data) instead
- Or ensure Google Sheets credentials are in the container

### "MongoDB connection failed"
```bash
# Check .env file in container
docker-compose exec backend cat .env | grep MONGODB_URI

# Test MongoDB connection
docker-compose exec backend node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected!')).catch(e => console.error(e));"
```

## Summary

**Easiest method for your setup:**

```bash
# 1. Upload script
scp backend/scripts/migrateCommitteeToServer.js user@server:/srv/apps/meeting-summary/backend/scripts/

# 2. SSH and run
ssh user@server
cd /srv/apps/meeting-summary
docker-compose exec backend node scripts/migrateCommitteeToServer.js
```

This will populate your committee table with all 135 members including Suhair! 🎉
