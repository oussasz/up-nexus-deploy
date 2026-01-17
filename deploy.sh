#!/bin/bash
# =============================================
# UP-NEXUS Auto-Deploy Script for cPanel
# Run this after git pull to set up the app
# =============================================

echo "🚀 Starting UP-NEXUS deployment..."

# Define paths
APP_DIR="/home/bnyqzpdb/upnexus"
PUBLIC_HTML="/home/bnyqzpdb/public_html"

# Navigate to app directory
cd "$APP_DIR" || exit 1

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Setup public_html if needed
echo "🔗 Setting up public_html..."

# Copy main files
cp "$APP_DIR/public/index.html" "$PUBLIC_HTML/index.html"
cp "$APP_DIR/public/404.html" "$PUBLIC_HTML/404.html"
cp "$APP_DIR/public_html/.htaccess" "$PUBLIC_HTML/.htaccess"

# Create symlinks (or copy if symlinks fail)
if ln -sfn "$APP_DIR/public/pages" "$PUBLIC_HTML/pages" 2>/dev/null; then
    echo "✓ Created symlink for pages"
    ln -sfn "$APP_DIR/public/css" "$PUBLIC_HTML/css"
    ln -sfn "$APP_DIR/public/js" "$PUBLIC_HTML/js"
    echo "✓ Created symlinks for css and js"
else
    echo "⚠ Symlinks not supported, copying files instead..."
    cp -r "$APP_DIR/public/pages" "$PUBLIC_HTML/"
    cp -r "$APP_DIR/public/css" "$PUBLIC_HTML/"
    cp -r "$APP_DIR/public/js" "$PUBLIC_HTML/"
    echo "✓ Copied pages, css, and js directories"
fi

# Restart the app (touch tmp/restart.txt for Passenger)
echo "🔄 Restarting application..."
mkdir -p tmp
touch tmp/restart.txt

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Test your deployment at:"
echo "   • https://www.up-nexus.com/"
echo "   • https://www.up-nexus.com/ecosystem"
echo "   • https://www.up-nexus.com/auth/login"
echo "   • https://www.up-nexus.com/api/health"
echo ""
