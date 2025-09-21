# Cloudflare Deployment - Changes Summary

## Files Modified/Created for Cloudflare Deployment

### Frontend Changes (`frontend/`)

1. **`next.config.ts`** - Updated for static export
   - Added `output: 'export'` for Cloudflare Pages
   - Configured image optimization for static builds
   - Added environment variable configuration

2. **`package.json`** - Added Cloudflare build script
   - Added `build:cloudflare` script

3. **`_headers`** - NEW - Cloudflare Pages headers configuration
   - Security headers (CORS, XSS protection, etc.)
   - Cache control for static assets

4. **`_redirects`** - NEW - URL rewrites and API proxy
   - API proxy to backend
   - SPA fallback routing

5. **`.env.example`** - NEW - Environment variables template
   - API base URL configuration
   - Site URL configuration

6. **`src/lib/api.ts`** - Updated API base URL logic
   - Uses `NEXT_PUBLIC_API_BASE_URL` environment variable
   - Fallback to localhost for development

### Backend Changes (`backend/`)

1. **`requirements-cloudflare.txt`** - NEW - Production dependencies
   - Added gunicorn, whitenoise, dj-database-url
   - Production-ready package versions

2. **`gt_backend/settings_production.py`** - NEW - Production Django settings
   - Database configuration with `DATABASE_URL`
   - Security headers and HTTPS settings
   - CORS configuration for Cloudflare Pages
   - Static files with WhiteNoise
   - Logging and monitoring setup

3. **`Procfile`** - NEW - Process configuration for deployment
   - Web server and migration commands

4. **`runtime.txt`** - NEW - Python version specification
   - Specifies Python 3.12.0

5. **`.env.production.example`** - Production environment variables template
   - All required environment variables documented

### Documentation

1. **`docs/cloudflare-deployment.md`** - Complete deployment guide
   - Step-by-step instructions for frontend and backend
   - Database setup options
   - Cloudflare configuration
   - Troubleshooting guide

## Quick Deployment Steps

### 1. Backend Deployment (Choose One)

**Option A: Heroku**
```bash
heroku create your-app-backend
heroku addons:create heroku-postgresql:essential-0
# Set environment variables (see deployment guide)
git push heroku main
```

**Option B: Railway/Render**
- Connect GitHub repository
- Set environment variables
- Auto-deploy on commits

### 2. Frontend Deployment (Cloudflare Pages)

1. **Update `_redirects`**: Replace backend URL
2. **Connect to Cloudflare Pages**:
   - Build command: `cd frontend && npm ci && npm run build`
   - Build output: `frontend/out`
3. **Set environment variables** in Cloudflare Pages dashboard

### 3. Environment Variables Required

**Frontend (Cloudflare Pages)**:
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend.herokuapp.com
NEXT_PUBLIC_SITE_URL=https://your-app.pages.dev
OPENROUTER_API_KEY=your_key
```

**Backend (Heroku/Railway/Render)**:
```
DJANGO_SECRET_KEY=secure_key
DJANGO_SETTINGS_MODULE=gt_backend.settings_production
DJANGO_ALLOWED_HOSTS=your-backend.herokuapp.com,your-frontend.pages.dev
DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend.pages.dev
DATABASE_URL=postgres://... (auto-set by hosting provider)
USE_HTTPS=1
```

## Cloudflare Settings

### Pages Settings
- **Build command**: `cd frontend && npm ci && npm run build`
- **Build output directory**: `frontend/out`
- **Environment variables**: Set API URLs and keys

### DNS (if using custom domain)
- Add domain to Cloudflare
- Update nameservers
- Configure SSL/TLS to "Full (strict)"

### Optional Optimizations
- **Page Rules**: Cache static assets, bypass API routes
- **Firewall Rules**: Rate limiting for API endpoints
- **Security**: Enable HSTS, Always Use HTTPS

## Testing

1. **Local Testing**:
   ```bash
   # Frontend
   cd frontend && npm run build && npm start
   
   # Backend with production settings
   DJANGO_SETTINGS_MODULE=gt_backend.settings_production python manage.py runserver
   ```

2. **Production Testing**:
   - Test login/signup functionality
   - Verify API connectivity
   - Check AI recommendations
   - Test public trip sharing

## Cost Estimate

- **Cloudflare Pages**: Free (100K requests/month)
- **Backend Hosting**: $7-15/month (Heroku Eco/Railway/Render)
- **Database**: $5-10/month (PostgreSQL)
- **Domain**: $10-15/year
- **Total**: ~$12-25/month

## Support

See `docs/cloudflare-deployment.md` for detailed instructions and troubleshooting. 