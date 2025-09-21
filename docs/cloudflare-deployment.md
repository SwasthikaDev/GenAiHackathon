# Cloudflare Deployment Guide for GlobalTrotters

This guide covers deploying both the frontend (Next.js) and backend (Django) using Cloudflare services.

## Architecture Overview

- **Frontend**: Cloudflare Pages (Static Site Hosting)
- **Backend**: External hosting (Heroku, Railway, Render, etc.) + Cloudflare as CDN/Proxy
- **Database**: PostgreSQL (Neon, Supabase, or traditional cloud providers)

## Prerequisites

1. Cloudflare account
2. GitHub repository
3. Domain name (optional, but recommended)

## Part 1: Backend Deployment

### Option A: Deploy to Heroku (Recommended)

1. **Create Heroku App**:
   ```bash
   heroku create your-app-name-backend
   ```

2. **Add PostgreSQL addon**:
   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set DJANGO_SECRET_KEY="your-super-secure-secret-key"
   heroku config:set DJANGO_DEBUG=0
   heroku config:set DJANGO_SETTINGS_MODULE=gt_backend.settings_production
   heroku config:set DJANGO_ALLOWED_HOSTS="your-app-name-backend.herokuapp.com,your-frontend-domain.pages.dev"
   heroku config:set DJANGO_CORS_ALLOWED_ORIGINS="https://your-frontend-domain.pages.dev"
   heroku config:set USE_HTTPS=1
   heroku config:set OPENROUTER_API_KEY="your-openrouter-key"
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

### Option B: Deploy to Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will auto-deploy on commits

### Option C: Deploy to Render

1. Connect GitHub repository to Render
2. Choose "Web Service"
3. Set build command: `pip install -r requirements-cloudflare.txt`
4. Set start command: `gunicorn gt_backend.wsgi:application`
5. Add environment variables

## Part 2: Database Setup

### Option A: Use Heroku Postgres (if using Heroku)
- Automatically configured with `DATABASE_URL`

### Option B: Use Neon (Serverless Postgres)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a database
3. Copy the connection string as `DATABASE_URL`

### Option C: Use Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Get the PostgreSQL connection string
3. Set as `DATABASE_URL`

## Part 3: Frontend Deployment (Cloudflare Pages)

### Step 1: Prepare Repository

1. **Update environment variables** in your repository:
   Create `.env.production` in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.herokuapp.com
   NEXT_PUBLIC_SITE_URL=https://your-app-name.pages.dev
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

2. **Update `_redirects` file**:
   Replace `your-backend-domain.com` in `frontend/_redirects` with your actual backend URL:
   ```
   /api/* https://your-backend-domain.herokuapp.com/api/:splat 200
   /* /index.html 200
   ```

### Step 2: Deploy to Cloudflare Pages

1. **Login to Cloudflare Dashboard**
2. **Go to Pages** section
3. **Connect to Git**:
   - Connect your GitHub repository
   - Select the repository

4. **Configure Build Settings**:
   - **Framework preset**: Next.js
   - **Build command**: `cd frontend && npm ci && npm run build`
   - **Build output directory**: `frontend/out`
   - **Root directory**: `/` (leave blank or set to root)

5. **Environment Variables**:
   Add these in Cloudflare Pages settings:
   ```
   NEXT_PUBLIC_API_BASE_URL = https://your-backend-domain.herokuapp.com
   NEXT_PUBLIC_SITE_URL = https://your-app-name.pages.dev
   OPENROUTER_API_KEY = your_openrouter_api_key
   ```

6. **Deploy**: Click "Save and Deploy"

## Part 4: Cloudflare Configuration

### DNS Settings (if using custom domain)

1. **Add your domain** to Cloudflare
2. **Update nameservers** to Cloudflare's
3. **Add DNS records**:
   - `A` record: `@` → `192.0.2.1` (dummy, Pages will override)
   - `CNAME` record: `www` → `your-app-name.pages.dev`

### Page Rules (Optional)

Create page rules for better performance:

1. **Cache Everything**:
   - URL: `your-domain.com/static/*`
   - Settings: Cache Level = Cache Everything

2. **API Bypass**:
   - URL: `your-domain.com/api/*`
   - Settings: Cache Level = Bypass

### Security Settings

1. **SSL/TLS**: Set to "Full (strict)"
2. **Always Use HTTPS**: Enable
3. **HSTS**: Enable with settings:
   - Max Age: 6 months
   - Include subdomains: Yes
   - No-sniff header: Yes

### Firewall Rules (Optional)

Add rate limiting for API endpoints:
1. Create rule: `(http.request.uri.path contains "/api/")`
2. Action: Rate limit (e.g., 100 requests per minute)

## Part 5: Post-Deployment Setup

### Backend Setup

1. **Run migrations**:
   ```bash
   # For Heroku
   heroku run python manage.py migrate
   
   # For other platforms, use their CLI or web interface
   ```

2. **Create superuser**:
   ```bash
   heroku run python manage.py createsuperuser
   ```

3. **Load seed data**:
   ```bash
   heroku run python manage.py seed_demo
   ```

### Frontend Verification

1. **Test the application**: Visit your Pages URL
2. **Check API connectivity**: Test login/signup functionality
3. **Verify AI features**: Test personalized recommendations

## Part 6: Custom Domain Setup (Optional)

### For Frontend (Cloudflare Pages)

1. **In Pages settings**, go to "Custom domains"
2. **Add your domain** (e.g., `globaltrotters.com`)
3. **Update DNS** if needed

### For Backend (if using custom subdomain)

1. **Add CNAME record**: `api.yourdomain.com` → `your-app-backend.herokuapp.com`
2. **Update environment variables** to use the new API URL

## Part 7: Monitoring and Optimization

### Performance Monitoring

1. **Enable Cloudflare Analytics**
2. **Set up Web Vitals monitoring**
3. **Configure Sentry** (optional) for error tracking

### Cost Optimization

1. **Cloudflare Pages**: Free tier (100K requests/month)
2. **Database**: Use free tiers initially (Neon/Supabase free tiers)
3. **Backend hosting**: Start with free/low-cost options

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Verify `DJANGO_CORS_ALLOWED_ORIGINS` includes your Pages domain
   - Check `_headers` file configuration

2. **Build Failures**:
   - Ensure `package.json` has correct build script
   - Check environment variables are set

3. **API Connection Issues**:
   - Verify `_redirects` file has correct backend URL
   - Check backend is running and accessible

4. **Database Connection**:
   - Ensure `DATABASE_URL` is correctly formatted
   - Check database credentials and permissions

### Debug Commands

```bash
# Check Heroku logs
heroku logs --tail

# Test backend locally with production settings
DJANGO_SETTINGS_MODULE=gt_backend.settings_production python manage.py runserver

# Test frontend build locally
cd frontend && npm run build && npm start
```

## Security Checklist

- [ ] Django `SECRET_KEY` is secure and unique
- [ ] `DEBUG=False` in production
- [ ] Database credentials are secure
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Security headers are set

## Scaling Considerations

- **Database**: Move to dedicated PostgreSQL when you reach traffic limits
- **Backend**: Use auto-scaling platforms or container orchestration
- **CDN**: Cloudflare automatically handles global distribution
- **Monitoring**: Implement comprehensive logging and alerting

## Cost Estimation

- **Cloudflare Pages**: Free tier (100K requests/month)
- **Heroku**: $7/month (Eco dyno) + $5/month (Essential Postgres)
- **Domain**: ~$10-15/year
- **Total**: ~$12-20/month for small to medium traffic

This setup provides a production-ready deployment with good performance, security, and scalability options. 