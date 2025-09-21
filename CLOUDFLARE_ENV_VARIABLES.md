# Cloudflare Pages Environment Variables

## Frontend Environment Variables (Cloudflare Pages Dashboard)

Go to your Cloudflare Pages project → Settings → Environment variables

### Production Environment Variables:

```
NEXT_PUBLIC_API_BASE_URL = https://your-backend-app-name.herokuapp.com
NEXT_PUBLIC_SITE_URL = https://your-pages-project-name.pages.dev  
OPENROUTER_API_KEY = your_openrouter_api_key_here
```

### How to Get These Values:

1. **NEXT_PUBLIC_API_BASE_URL**: 
   - After deploying backend to Heroku: `https://your-app-name.herokuapp.com`
   - After deploying to Railway: `https://your-app.railway.app`
   - After deploying to Render: `https://your-app.onrender.com`

2. **NEXT_PUBLIC_SITE_URL**: 
   - Your Cloudflare Pages URL: `https://your-project-name.pages.dev`
   - Or your custom domain if you add one

3. **OPENROUTER_API_KEY**: 
   - Sign up at [openrouter.ai](https://openrouter.ai)
   - Get API key from dashboard
   - This enables AI-powered travel recommendations

### After Setting Environment Variables:

1. Go to your Cloudflare Pages project
2. Click **"Deployments"** tab  
3. Click **"Retry deployment"** to rebuild with new environment variables

## Backend Environment Variables (Heroku/Railway/Render)

```bash
# Security
DJANGO_SECRET_KEY=your-super-secure-secret-key-change-this
DJANGO_SETTINGS_MODULE=gt_backend.settings_production
DJANGO_DEBUG=0
USE_HTTPS=1

# URLs and CORS
DJANGO_ALLOWED_HOSTS=your-backend-domain.com,your-frontend-domain.pages.dev
DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend-domain.pages.dev

# Database (usually auto-set by hosting provider)
DATABASE_URL=postgres://username:password@hostname:port/database

# AI Integration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_SITE_URL=https://your-frontend-domain.pages.dev
OPENROUTER_APP_NAME=GlobalTrotters

# Rate Limiting
THROTTLE_PERSONALIZED=3/min
THROTTLE_GENERATE=2/min
THROTTLE_SEARCH_CITIES=20/min
THROTTLE_SEARCH_ACTIVITIES=60/min
``` 