#!/bin/bash

# Data Migration Script for Server
# This script imports data from local MongoDB export to server MongoDB
# 
# Usage on server:
# 1. Upload this script and the exported_data folder to the server
# 2. Make executable: chmod +x deploy_data.sh
# 3. Run: ./deploy_data.sh

set -e  # Exit on error

echo "==========================================="
echo "  Meeting App - Data Migration to Server"
echo "==========================================="
echo ""

# Check if exported_data directory exists
if [ ! -d "exported_data" ]; then
    echo "ERROR: exported_data directory not found!"
    echo "Please upload the exported_data folder to the same directory as this script."
    exit 1
fi

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "ERROR: .env file not found in parent directory!"
    echo "Please ensure .env file exists with MONGODB_URI configured."
    exit 1
fi

echo "✓ Found exported_data directory"
echo "✓ Found .env file"
echo ""

# Load environment variables
export $(cat ../.env | grep -v '^#' | xargs)

if [ -z "$MONGODB_URI" ]; then
    echo "ERROR: MONGODB_URI not set in .env file!"
    exit 1
fi

echo "Target MongoDB URI: ${MONGODB_URI%%@*}@***"
echo ""

# Confirm before proceeding
read -p "This will import data to the server MongoDB. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Starting data import..."
echo ""

# Run the import script
cd ..
node scripts/importData.js

echo ""
echo "==========================================="
echo "  Migration Complete!"
echo "==========================================="
echo ""
echo "IMPORTANT: All users have default password: ChangeMe123!"
echo "Users must change their passwords on first login."
echo ""
