# UP-NEXUS cPanel Deployment

## Problem Fixed
The website was redirecting all page requests to the homepage because the `.htaccess` file was configured to route everything through Node.js Passenger instead of serving the static HTML pages directly.

## Solution Implemented

### 1. Updated `.htaccess` Configuration
The `.htaccess` file in `public_html/` has been updated to:
- ✅ Serve static HTML pages directly from the file system
- ✅ Route `/api/*` requests to the Node.js backend via Passenger
- ✅ Handle clean URLs (e.g., `/ecosystem` → `/pages/ecosystem.html`)
- ✅ Support all page routes: auth, admin, dashboard, and root-level pages
- ✅ Preserve existing features: HTTPS redirect, GZIP compression, caching

### 2. Fixed File Structure
- Replaced the redirect-only `index.html` with the actual homepage
- Created symlinks from `public_html/` to `public/` folders (pages, css, js)
- Ensured all static assets are accessible

### 3. Created Automated Deployment Script
The `deploy.sh` script now handles:
- Installing Node.js dependencies
- Copying necessary files to public_html
- Creating symlinks (or copying if symlinks aren't supported)
- Restarting the Passenger application

## File Structure
```
cpanel-deployment/
├── public/                 # Main application files
│   ├── index.html         # Homepage
│   ├── 404.html          # Error page
│   ├── pages/            # All page HTML files
│   ├── css/              # Stylesheets
│   └── js/               # JavaScript files
├── public_html/           # Deployment folder (symlinked to public/)
│   ├── .htaccess         # Apache configuration (IMPORTANT!)
│   ├── index.html        # Homepage (copied)
│   ├── 404.html          # Error page (copied)
│   ├── pages -> ../public/pages   # Symlink
│   ├── css -> ../public/css       # Symlink
│   └── js -> ../public/js         # Symlink
├── api/                   # Node.js backend
└── deploy.sh             # Automated deployment script
```

## Deployment Instructions

### For Production (cPanel)
1. Upload files to: `/home/bnyqzpdb/upnexus/`
2. Run the deployment script:
   ```bash
   cd /home/bnyqzpdb/upnexus
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Manual Deployment Steps
If you need to deploy manually:

```bash
# Navigate to app directory
cd /home/bnyqzpdb/upnexus

# Install dependencies
npm install --production

# Setup public_html
cd /home/bnyqzpdb/public_html

# Copy main files
cp /home/bnyqzpdb/upnexus/public/index.html .
cp /home/bnyqzpdb/upnexus/public/404.html .
cp /home/bnyqzpdb/upnexus/public_html/.htaccess .

# Create symlinks
ln -sfn /home/bnyqzpdb/upnexus/public/pages pages
ln -sfn /home/bnyqzpdb/upnexus/public/css css
ln -sfn /home/bnyqzpdb/upnexus/public/js js

# Restart app
cd /home/bnyqzpdb/upnexus
mkdir -p tmp
touch tmp/restart.txt
```

## Testing the Deployment
After deployment, test these URLs:

- ✅ https://www.up-nexus.com/ (Homepage)
- ✅ https://www.up-nexus.com/ecosystem (Ecosystem page)
- ✅ https://www.up-nexus.com/auth/login (Login page)
- ✅ https://www.up-nexus.com/auth/register (Register page)
- ✅ https://www.up-nexus.com/admin (Admin dashboard)
- ✅ https://www.up-nexus.com/dashboard (User dashboard)
- ✅ https://www.up-nexus.com/about (About page)
- ✅ https://www.up-nexus.com/contact (Contact page)
- ✅ https://www.up-nexus.com/pricing (Pricing page)
- ✅ https://www.up-nexus.com/api/health (API health check)

## How the Routing Works

### Static Pages (handled by Apache)
```
/ecosystem → /pages/ecosystem.html
/auth/login → /pages/auth/login.html
/admin → /pages/admin/dashboard.html
```

### API Routes (handled by Node.js)
```
/api/* → Node.js backend via Passenger
```

### Static Assets
```
/css/* → Direct file access
/js/* → Direct file access
/images/* → Direct file access
```

## Troubleshooting

### Problem: Pages still redirect to homepage
**Solution:** 
1. Verify `.htaccess` is in public_html
2. Check Apache mod_rewrite is enabled
3. Ensure symlinks point to correct locations

### Problem: 404 errors on all pages
**Solution:**
1. Check symlinks exist: `ls -la /home/bnyqzpdb/public_html/`
2. Verify permissions: files should be readable by Apache
3. Check Apache error logs

### Problem: CSS/JS not loading
**Solution:**
1. Verify symlinks: `ls -la /home/bnyqzpdb/public_html/css`
2. Check file permissions
3. Clear browser cache

### Problem: API requests fail
**Solution:**
1. Restart Node.js: `touch tmp/restart.txt`
2. Check Node.js logs
3. Verify Passenger configuration in `.htaccess`

## Important Notes

1. **Never edit files directly in public_html** - Edit in `public/` and redeploy
2. **After changes** - Always run `deploy.sh` or restart: `touch tmp/restart.txt`
3. **Symlinks** - If your host doesn't support symlinks, the script will copy files instead
4. **Permissions** - Ensure Apache can read all files (644 for files, 755 for directories)

## Changes Made to Fix the Issue

### Before (Broken)
- `.htaccess` routed ALL requests through Node.js
- public_html only had a redirect page
- No clean URL routing for static pages

### After (Fixed)
- `.htaccess` routes static pages directly
- `/api/*` still goes through Node.js
- Clean URLs work properly
- All pages accessible without redirects
