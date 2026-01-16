#!/bin/bash
# =============================================
# UP-NEXUS Auto-Deploy Script for cPanel
# Run this after git pull to set up the app
# =============================================

echo "🚀 Starting UP-NEXUS deployment..."

# Navigate to app directory
cd /home/bnyqzpdb/upnexus

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Restart the app (touch tmp/restart.txt for Passenger)
echo "🔄 Restarting application..."
mkdir -p tmp
touch tmp/restart.txt

echo "✅ Deployment complete!"
