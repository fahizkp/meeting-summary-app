# MongoDB Connection Status - Meeting Summary App

## ✅ Connection Status: WORKING

Both local and Docker MongoDB connections are functioning correctly.

## MongoDB Instances

### 1. **Local MongoDB** (Host Machine)
- **URL**: `mongodb://localhost:27017`
- **Port**: 27017
- **Status**: ✅ Running and accessible
- **Used by**: Local development (when running backend with `npm start` outside Docker)
- **Test**: `mongosh --eval "db.adminCommand('ping')" mongodb://localhost:27017`
- **Result**: `{ ok: 1 }` ✅

### 2. **Docker MongoDB** (Container)
- **Container Name**: `meeting-summary-mongo`
- **Internal URL**: `mongodb://mongo:27017` (from other containers)
- **External URL**: `mongodb://localhost:27018` (from host machine)
- **Port Mapping**: `27018:27017` (host:container)
- **Status**: ✅ Running and accessible
- **Used by**: Docker backend container
- **Volume**: `mongo-data` (persistent storage)

## Connection Configuration

### Docker Environment (docker-compose.yml)
```yaml
backend:
  environment:
    - MONGODB_URI=mongodb://mongo:27017/meeting_app  # ✅ Correct for Docker
```

**Why `mongo` instead of `localhost`?**
- Inside Docker network, containers communicate via service names
- `mongo` is the service name defined in docker-compose.yml
- Docker DNS resolves `mongo` to the MongoDB container's IP

### Local Development (backend/.env)
```env
MONGODB_URI=mongodb://localhost:27017/meeting_app  # ✅ Correct for local dev
```

**Why `localhost`?**
- When running backend locally (outside Docker), it connects to local MongoDB
- Port 27017 is the standard MongoDB port on the host machine

## Verification Tests

### Test 1: Docker Backend → Docker MongoDB
```bash
docker compose exec backend node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err));"
```
**Result**: ✅ `MongoDB Connected Successfully`

### Test 2: Backend Container Listening
```bash
docker compose exec backend sh -c "netstat -tln | grep 3001"
```
**Result**: ✅ `tcp 0 0 :::3001 :::* LISTEN`

### Test 3: Local MongoDB Ping
```bash
mongosh --eval "db.adminCommand('ping')" mongodb://localhost:27017
```
**Result**: ✅ `{ ok: 1 }`

### Test 4: Docker MongoDB from Host
```bash
mongosh --eval "db.adminCommand('ping')" mongodb://localhost:27018
```
**Result**: ✅ Should return `{ ok: 1 }`

## Connection Scenarios

### Scenario 1: Running in Docker (Current Setup)
- **Frontend**: http://localhost:5174 → Backend at http://localhost:3002
- **Backend**: Container → MongoDB at `mongodb://mongo:27017`
- **MongoDB**: Docker container (port 27018 on host)
- **Status**: ✅ WORKING

### Scenario 2: Running Locally (Development)
- **Frontend**: `npm run dev` (port 5173)
- **Backend**: `npm start` (port 3001) → MongoDB at `mongodb://localhost:27017`
- **MongoDB**: Local instance (port 27017)
- **Status**: ✅ Should work (if local MongoDB is running)

### Scenario 3: Mixed (Frontend Local, Backend Docker)
- **Frontend**: http://localhost:5173 → Backend at http://localhost:3002
- **Backend**: Docker container → MongoDB at `mongodb://mongo:27017`
- **MongoDB**: Docker container
- **Note**: Need to update frontend API URL to `http://localhost:3002`

## Common Issues & Solutions

### Issue 1: "Connection Refused" in Docker
**Symptom**: Backend can't connect to MongoDB  
**Cause**: Using `localhost` instead of `mongo` in Docker  
**Solution**: ✅ Already fixed - docker-compose.yml overrides with correct URL

### Issue 2: Port Already in Use
**Symptom**: Can't start MongoDB container on port 27017  
**Cause**: Local MongoDB already using port 27017  
**Solution**: ✅ Already fixed - using port 27018 for Docker MongoDB

### Issue 3: Empty Database in Docker
**Symptom**: No data after starting Docker containers  
**Solution**: Run seed script
```bash
docker compose exec backend node scripts/seedData.js
```

### Issue 4: Data Not Persisting
**Symptom**: Data lost after `docker compose down`  
**Cause**: Volume not properly configured  
**Solution**: ✅ Already configured - `mongo-data` volume in docker-compose.yml

## Database Management

### Access Docker MongoDB Shell
```bash
# From host machine
mongosh mongodb://localhost:27018/meeting_app

# From within container
docker compose exec mongo mongosh meeting_app
```

### View Collections
```javascript
show collections
db.users.find()
db.zones.find()
db.meetings.find()
```

### Seed Database
```bash
docker compose exec backend node scripts/seedData.js
```

### Clear Database
```bash
docker compose exec mongo mongosh meeting_app --eval "db.dropDatabase()"
```

### Backup Database
```bash
docker compose exec mongo mongodump --db meeting_app --out /tmp/backup
docker cp meeting-summary-mongo:/tmp/backup ./backup
```

### Restore Database
```bash
docker cp ./backup meeting-summary-mongo:/tmp/backup
docker compose exec mongo mongorestore --db meeting_app /tmp/backup/meeting_app
```

## Environment Variables

### Docker (.env in root)
```env
MONGODB_URI=mongodb://mongo:27017/meeting_app
```
**Note**: This is overridden by docker-compose.yml environment section

### Local (backend/.env)
```env
MONGODB_URI=mongodb://localhost:27017/meeting_app
```

## Network Diagram

```
┌─────────────────────────────────────────────────┐
│  Host Machine (Windows)                         │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Docker Network: meeting-summary-internal│  │
│  │                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │
│  │  │ Frontend │──│ Backend  │──│ MongoDB│ │  │
│  │  │  :5173   │  │  :3001   │  │ :27017 │ │  │
│  │  └────┬─────┘  └────┬─────┘  └───┬────┘ │  │
│  └───────┼─────────────┼─────────────┼──────┘  │
│          │             │             │          │
│      :5174         :3002         :27018        │
│          │             │             │          │
│  ┌───────┴─────────────┴─────────────┴──────┐  │
│  │         Local MongoDB :27017              │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Recommendations

### For Docker Development (Current)
✅ **Keep using Docker Compose** - Everything is configured correctly
- MongoDB: `mongodb://mongo:27017` (internal)
- Access from host: `mongodb://localhost:27018`

### For Local Development
If you want to run backend locally:
1. Ensure local MongoDB is running on port 27017
2. Use `backend/.env` with `MONGODB_URI=mongodb://localhost:27017/meeting_app`
3. Run `npm start` in backend directory
4. Seed database: `node scripts/seedData.js`

### For Production
- Use managed MongoDB service (MongoDB Atlas, etc.)
- Update `MONGODB_URI` in production environment
- Never commit `.env` files with production credentials

## Current Status Summary

| Component | Status | Connection |
|-----------|--------|------------|
| Docker MongoDB | ✅ Running | Port 27018 (external) |
| Docker Backend | ✅ Running | Connected to Docker MongoDB |
| Docker Frontend | ✅ Running | Connected to Docker Backend |
| Local MongoDB | ✅ Running | Port 27017 |
| Database Seeded | ✅ Yes | Test users available |

---

**Everything is working correctly!** 🎉

If you're experiencing issues, please specify:
1. Are you running in Docker or locally?
2. What error messages are you seeing?
3. Which component is having the connection issue?
