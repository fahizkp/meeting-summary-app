# How Docker Works - Meeting Summary App

## 🐳 Docker Architecture Explained

### **What is Docker?**

Docker creates **isolated containers** - think of them as lightweight virtual machines. Each container runs independently but can communicate with other containers through **Docker networks**.

## 📦 Our Docker Setup

### **Three Containers Running:**

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host (Your PC)                 │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Docker Network: "meeting-summary-internal"        │ │
│  │                                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │ │
│  │  │   Frontend   │  │   Backend    │  │ MongoDB  │ │ │
│  │  │  Container   │  │  Container   │  │Container │ │ │
│  │  │              │  │              │  │          │ │ │
│  │  │  Node.js     │  │  Node.js     │  │  Mongo   │ │ │
│  │  │  Vite        │  │  Express     │  │  7.0     │ │ │
│  │  │              │  │              │  │          │ │ │
│  │  │  Port: 5173  │  │  Port: 3001  │  │Port:27017│ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │ │
│  │         │                 │                │       │ │
│  │         │    HTTP API     │   MongoDB      │       │ │
│  │         └────────────────→│   Protocol     │       │ │
│  │                            └───────────────→│       │ │
│  └────────┬──────────────────┬────────────────┬───────┘ │
│           │                  │                │          │
│       Port 5174          Port 3002        Port 27018    │
│           │                  │                │          │
│           ↓                  ↓                ↓          │
│    [Your Browser]      [API Requests]   [DB Access]     │
└─────────────────────────────────────────────────────────┘
```

## 🔌 How Database Connection Works

### **Step-by-Step Connection Flow:**

#### **1. Docker Compose Starts**
```bash
docker compose up -d
```

**What happens:**
- Creates a virtual network called `meeting-summary-internal`
- Starts 3 containers on this network
- Each container gets a hostname (service name)

#### **2. MongoDB Container Starts**
```yaml
mongo:
  image: mongo:7
  container_name: meeting-summary-mongo
  networks:
    - meeting-summary-internal
```

**What happens:**
- Downloads MongoDB 7 image (if not already downloaded)
- Creates a container named `meeting-summary-mongo`
- Assigns hostname: `mongo` (from service name)
- Starts MongoDB on port 27017 **inside the container**
- Creates a volume `mongo-data` to store database files

#### **3. Backend Container Starts**
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile.local
  environment:
    - MONGODB_URI=mongodb://mongo:27017/meeting_app
  depends_on:
    - mongo
```

**What happens:**
- Builds the backend image from `backend/Dockerfile.local`
- Waits for MongoDB container to start (`depends_on: mongo`)
- Sets environment variable: `MONGODB_URI=mongodb://mongo:27017/meeting_app`
- Starts the Node.js server on port 3001

#### **4. Backend Connects to MongoDB**

**In the backend code (`backend/config/mongodb.js`):**
```javascript
const mongoose = require('mongoose');

// Reads MONGODB_URI from environment
const MONGODB_URI = process.env.MONGODB_URI;
// Value: "mongodb://mongo:27017/meeting_app"

mongoose.connect(MONGODB_URI);
```

**The Magic: Docker DNS**
- When backend tries to connect to `mongo:27017`
- Docker's internal DNS resolves `mongo` to the MongoDB container's IP
- Connection established! ✅

### **Why "mongo" and not "localhost"?**

**Inside Docker Network:**
```
Backend Container:
  - "mongo" → MongoDB container IP (e.g., 172.18.0.2)
  - "localhost" → Backend container itself (NOT MongoDB!)
```

**Docker DNS Resolution:**
```
Service Name: mongo
    ↓
Docker DNS Lookup
    ↓
MongoDB Container IP: 172.18.0.2
    ↓
Connection Established ✅
```

## 🌐 Port Mapping Explained

### **Container Ports vs Host Ports**

```
Format: HOST_PORT:CONTAINER_PORT
```

#### **MongoDB:**
```yaml
ports:
  - "27018:27017"
```

**Meaning:**
- **Inside Docker**: MongoDB listens on port `27017`
- **From Your PC**: Access via port `27018`
- **From Backend Container**: Access via `mongo:27017` (no port mapping needed!)

#### **Backend:**
```yaml
ports:
  - "3002:3001"
```

**Meaning:**
- **Inside Docker**: Backend listens on port `3001`
- **From Your PC**: Access via `http://localhost:3002`
- **From Frontend Container**: Access via `http://backend:3001`

#### **Frontend:**
```yaml
ports:
  - "5174:5173"
```

**Meaning:**
- **Inside Docker**: Vite dev server on port `5173`
- **From Your Browser**: Access via `http://localhost:5174`

## 🔄 Complete Request Flow

### **Example: User Logs In**

```
1. Browser (Your PC)
   ↓
   http://localhost:5174/login
   ↓
2. Frontend Container (Port 5174 → 5173)
   ↓
   POST http://localhost:3002/api/auth/login
   ↓
3. Docker Port Mapping (3002 → 3001)
   ↓
4. Backend Container (Port 3001)
   ↓
   mongoose.connect('mongodb://mongo:27017/meeting_app')
   ↓
5. Docker DNS Resolution
   ↓
   "mongo" → 172.18.0.2 (MongoDB container IP)
   ↓
6. MongoDB Container (Port 27017)
   ↓
   Query: db.users.findOne({ username: 'admin' })
   ↓
7. Response flows back:
   MongoDB → Backend → Frontend → Browser
```

## 📝 Configuration Files

### **docker-compose.yml** (The Orchestrator)
```yaml
services:
  mongo:
    image: mongo:7                    # What to run
    container_name: meeting-summary-mongo
    networks:
      - meeting-summary-internal      # Which network
    ports:
      - "27018:27017"                 # Port mapping
    volumes:
      - mongo-data:/data/db           # Data persistence

  backend:
    build:
      context: ./backend              # Where to build from
      dockerfile: Dockerfile.local
    environment:
      - MONGODB_URI=mongodb://mongo:27017/meeting_app  # ← KEY!
    depends_on:
      - mongo                         # Start order
    networks:
      - meeting-summary-internal
    ports:
      - "3002:3001"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.local
    environment:
      - VITE_API_URL=http://localhost:3002  # Backend URL
    depends_on:
      - backend
    networks:
      - meeting-summary-internal
    ports:
      - "5174:5173"

networks:
  meeting-summary-internal:           # Creates isolated network

volumes:
  mongo-data:                         # Persistent storage
```

### **Environment Variable Override**

**Priority (highest to lowest):**
1. `docker-compose.yml` environment section ← **WINS**
2. `.env` file in root
3. `backend/.env` file

**Example:**
```
backend/.env:
  MONGODB_URI=mongodb://localhost:27017/meeting_app

docker-compose.yml:
  environment:
    - MONGODB_URI=mongodb://mongo:27017/meeting_app  ← THIS ONE WINS!
```

## 🔍 How to Verify Connection

### **1. Check if containers are running:**
```bash
docker compose ps
```

**Expected output:**
```
NAME                       STATUS
meeting-summary-mongo      Up
meeting-summary-backend    Up
meeting-summary-frontend   Up
```

### **2. Check backend logs:**
```bash
docker compose logs backend
```

**Look for:**
```
MongoDB connected successfully
Server running on port 3001
```

### **3. Test MongoDB connection from backend:**
```bash
docker compose exec backend node -e "
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected!'))
    .catch(err => console.error('❌ Error:', err));
"
```

### **4. Check network connectivity:**
```bash
# From backend container, ping MongoDB
docker compose exec backend ping -c 3 mongo
```

### **5. Access MongoDB directly:**
```bash
# From your PC (host)
mongosh mongodb://localhost:27018/meeting_app

# From inside backend container
docker compose exec backend node -e "
  const mongoose = require('mongoose');
  mongoose.connect('mongodb://mongo:27017/meeting_app')
    .then(() => mongoose.connection.db.admin().ping())
    .then(result => console.log('Ping result:', result))
    .then(() => process.exit(0));
"
```

## 🎯 Key Concepts

### **1. Docker Network**
- Isolated virtual network
- Containers can talk to each other using **service names**
- Like a private LAN for your containers

### **2. Service Names as Hostnames**
```yaml
services:
  mongo:      # ← This becomes hostname "mongo"
  backend:    # ← This becomes hostname "backend"
  frontend:   # ← This becomes hostname "frontend"
```

### **3. Port Mapping**
- **Container Port**: Port inside the container
- **Host Port**: Port on your PC
- **Format**: `HOST:CONTAINER`

### **4. Volumes**
- Persistent storage
- Data survives container restarts
- Located on your PC, mounted into container

### **5. Environment Variables**
- Configuration passed to containers
- Can override `.env` files
- Set in `docker-compose.yml`

## 🚀 Why This Setup?

### **Advantages:**

1. **Isolation**: Each service in its own container
2. **Consistency**: Same environment everywhere
3. **Easy Setup**: One command to start everything
4. **No Conflicts**: Different ports for Docker vs local
5. **Persistence**: Data saved in volumes
6. **Networking**: Automatic DNS resolution

### **How It's Different from Local:**

**Local Development:**
```
Your PC
  ├── MongoDB (port 27017)
  ├── Backend (port 3001) → connects to localhost:27017
  └── Frontend (port 5173) → connects to localhost:3001
```

**Docker Development:**
```
Your PC
  └── Docker
      ├── MongoDB Container (internal: 27017, external: 27018)
      ├── Backend Container (internal: 3001, external: 3002)
      │   └── connects to mongo:27017 (via Docker DNS)
      └── Frontend Container (internal: 5173, external: 5174)
          └── connects to localhost:3002 (via port mapping)
```

## 📊 Summary

**Database Connection in Docker:**

1. ✅ MongoDB runs in container on port 27017
2. ✅ Backend runs in container on port 3001
3. ✅ Both containers on same Docker network
4. ✅ Backend uses `mongodb://mongo:27017` to connect
5. ✅ Docker DNS resolves `mongo` to MongoDB container IP
6. ✅ Connection established automatically!

**From Your PC:**
- Frontend: `http://localhost:5174`
- Backend: `http://localhost:3002`
- MongoDB: `mongodb://localhost:27018`

**Inside Docker:**
- Frontend → Backend: `http://backend:3001`
- Backend → MongoDB: `mongodb://mongo:27017`

---

**The key insight:** Docker creates a virtual network where containers can find each other by name, making connections simple and automatic! 🎉
