# 🐳 Meeting App - Local Docker Guide

This guide explains how to run the Meeting Summary App locally using Docker.

## 🚀 Quick Start

1.  **Stop all other running servers:**
    Make sure you serve no other terminals running `npm start`, `npm run dev`, or any other node processes on ports `3001` or `5173`. Docker needs these ports free.

2.  **Start the App:**
    Run the following command in your terminal:
    ```bash
    docker-compose -f docker-compose.local.yml up --build
    ```

3.  **Access the App:**
    *   **Frontend:** [http://localhost:5173](http://localhost:5173)
    *   **Backend API:** [http://localhost:3001](http://localhost:3001)
    *   **Database:** `mongodb://localhost:27017`

## 🏗️ Architecture

The app runs as **3 separate services** that communicate with each other:

### 1. 🍃 MongoDB (`mongodb`)
*   **Role:** The Database.
*   **Port:** `27017`
*   **Data Persistence:** Data is stored in a Docker volume (`mongodb_data`), so you don't lose meetings/users when you restart the container.

### 2. 🧠 Backend (`backend`)
*   **Role:** Node.js/Express API Server.
*   **Port:** `3001`
*   **Tech:** Uses `nodemon` for hot-reloading.
*   **Internal Network:** Talks to database at `mongodb://mongodb:27017`.

### 3. 🎨 Frontend (`frontend`)
*   **Role:** React/Vite UI.
*   **Port:** `5173`
*   **Tech:** Uses Vite's HMR (Hot Module Replacement) for instant updates.

## 🛠️ Common Commands

| Action | Command |
| :--- | :--- |
| **Start App** | `docker-compose -f docker-compose.local.yml up` |
| **Rebuild & Start** | `docker-compose -f docker-compose.local.yml up --build` |
| **Stop App** | Press `Ctrl+C` in the terminal |
| **Stop & Remove Containers** | `docker-compose -f docker-compose.local.yml down` |
| **View Logs** | `docker-compose -f docker-compose.local.yml logs -f` |

## ❌ Troubleshooting

**"Port is already allocated" Error:**
This means another program (likely a local `npm start`) is using port 3001 or 5173.
*   **Fix:** Close all other terminal windows or stop the running processes, then try again.

**"Connection Refused" to MongoDB:**
*   **Fix:** Ensure the `mongodb` service is healthy. Check logs with `docker logs meeting-app-mongodb`.
