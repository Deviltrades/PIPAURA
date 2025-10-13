# Vercel Cron Endpoints Setup

This document explains how to configure cron-job.org to call the Vercel-deployed cron endpoints instead of the Replit development URLs.

## Architecture

The cron system has been migrated from Python scripts on Replit to JavaScript serverless functions on Vercel:

- **Forex Factory feed parsing** → `lib/cron/forex-factory.js`
- **Hourly bias calculation** → `lib/cron/hourly-bias.js`
- **API endpoints** → `api/cron/*.js`

## Vercel Endpoints

Your Vercel app URL: `https://your-app-name.vercel.app`

### Available Endpoints:

1. **Health Check** (No auth required)
   ```
   GET https://your-app-name.vercel.app/api/cron/health
   ```

2. **High-Impact Event Check** (Every 15 minutes)
   ```
   POST https://your-app-name.vercel.app/api/cron/ff-high-impact
   Headers: x-api-key: YOUR_CRON_API_KEY
   ```

3. **Full Calendar Refresh** (Every 4 hours)
   ```
   POST https://your-app-name.vercel.app/api/cron/ff-full-refresh
   Headers: x-api-key: YOUR_CRON_API_KEY
   ```

4. **Hourly Bias Update** (Every 30 minutes / hourly)
   ```
   POST https://your-app-name.vercel.app/api/cron/hourly-update
   Headers: x-api-key: YOUR_CRON_API_KEY
   ```

## Deployment Steps

### 1. Deploy to Vercel

Your app should already be connected to Vercel. After pushing the changes:

```bash
git add .
git commit -m "Migrate cron endpoints to Vercel serverless functions"
git push origin main
```

Vercel will automatically deploy the changes.

### 2. Configure Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (from Supabase dashboard)
- `CRON_API_KEY` - A secret key for cron authentication (generate a random string)

### 3. Update cron-job.org

Log in to cron-job.org and update each job:

#### Job 1: High-Impact Event Check (Every 15 minutes)
- **URL**: `https://your-app-name.vercel.app/api/cron/ff-high-impact`
- **Method**: POST
- **Headers**: 
  ```
  x-api-key: YOUR_CRON_API_KEY
  ```
- **Schedule**: Every 15 minutes

#### Job 2: Full Calendar Refresh (Every 4 hours)
- **URL**: `https://your-app-name.vercel.app/api/cron/ff-full-refresh`
- **Method**: POST
- **Headers**:
  ```
  x-api-key: YOUR_CRON_API_KEY
  ```
- **Schedule**: Every 4 hours

#### Job 3: Hourly Bias Update (Every 30 minutes)
- **URL**: `https://your-app-name.vercel.app/api/cron/hourly-update`
- **Method**: POST
- **Headers**:
  ```
  x-api-key: YOUR_CRON_API_KEY
  ```
- **Schedule**: Every 30 minutes (or hourly)

### 4. Test the Endpoints

Test each endpoint manually:

```bash
# Health check (no auth)
curl https://your-app-name.vercel.app/api/cron/health

# High-impact check (with auth)
curl -X POST https://your-app-name.vercel.app/api/cron/ff-high-impact \
  -H "x-api-key: YOUR_CRON_API_KEY"

# Full refresh (with auth)
curl -X POST https://your-app-name.vercel.app/api/cron/ff-full-refresh \
  -H "x-api-key: YOUR_CRON_API_KEY"

# Hourly update (with auth)
curl -X POST https://your-app-name.vercel.app/api/cron/hourly-update \
  -H "x-api-key: YOUR_CRON_API_KEY"
```

## Benefits of This Architecture

✅ **Completely free** - Vercel free tier includes serverless functions  
✅ **Always available** - No sleeping, no 502 errors  
✅ **Production-ready** - Stable URLs that don't change  
✅ **No Replit dependency** - Works independently  
✅ **JavaScript ES6+** - Modern, maintainable code  
✅ **Automatic scaling** - Handles traffic spikes automatically  

## Troubleshooting

### 401 Unauthorized
- Check that `x-api-key` header is set correctly
- Verify `CRON_API_KEY` environment variable in Vercel

### 500 Internal Server Error
- Check Vercel function logs in Vercel dashboard
- Verify Supabase credentials are set correctly
- Check that all environment variables are present

### No data updates
- Check Vercel function logs for errors
- Verify Forex Factory feed is accessible: https://nfs.faireconomy.media/ff_calendar_thisweek.xml
- Check Supabase tables for new data

## Monitoring

View logs in real-time:
1. Go to Vercel dashboard
2. Select your project
3. Click "Functions" tab
4. View logs for each function call

## Weekly Deep Analysis (Optional)

If you want to keep the weekly deep analysis (main.py), you can create a separate endpoint:

```javascript
// api/cron/weekly-analysis.js
export default async function handler(req, res) {
  // Implementation would be similar to hourly-update but with weekly logic
}
```

However, the current hourly updates should provide sufficient fundamental bias data.
