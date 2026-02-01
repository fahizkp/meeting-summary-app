#!/bin/bash

# Committee Migration Script - Docker Version
# This script runs the committee migration using Docker
# 
# Usage on server:
#   chmod +x migrate_committee_docker.sh
#   ./migrate_committee_docker.sh

set -e

echo "==========================================="
echo "  Committee Data Migration (Docker)"
echo "==========================================="
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ ERROR: Docker is not available!"
    echo "Please ensure Docker is installed and running."
    exit 1
fi

echo "✓ Docker is available"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo "Backend directory: $BACKEND_DIR"
echo ""

# Check if the migration script exists
if [ ! -f "$SCRIPT_DIR/migrateCommitteeToServer.js" ]; then
    echo "❌ ERROR: migrateCommitteeToServer.js not found!"
    echo "Expected location: $SCRIPT_DIR/migrateCommitteeToServer.js"
    exit 1
fi

echo "✓ Migration script found"
echo ""

# Confirm before proceeding
read -p "This will migrate committee data from Google Sheets to MongoDB. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Starting migration using Docker..."
echo ""

# Run the migration script using the backend Docker container
# Assuming your docker-compose service name is 'backend'
cd "$BACKEND_DIR/.."

# Try to find the backend container
BACKEND_CONTAINER=$(docker-compose ps -q backend 2>/dev/null || docker ps -q -f name=backend)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo "❌ ERROR: Backend container not found!"
    echo "Please ensure the backend container is running."
    echo ""
    echo "Try: docker-compose up -d backend"
    exit 1
fi

echo "✓ Found backend container: $BACKEND_CONTAINER"
echo ""

# Execute the migration script inside the container
docker exec -it $BACKEND_CONTAINER node scripts/migrateCommitteeToServer.js

echo ""
echo "==========================================="
echo "  Migration Complete!"
echo "==========================================="
echo ""
