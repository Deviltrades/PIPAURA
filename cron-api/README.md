# TJ Traders Brotherhood - Cron API

Standalone Vercel serverless functions for automated fundamental bias updates.

## Deployment

1. **Create new Vercel project:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import this `cron-api` folder (not the root repo)
   - Project name: `tj-cron-api`

2. **Set environment variables in Vercel:**
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `CRON_API_KEY` - Secret key for cron authentication

3. **Test endpoints:**
   ```bash
   # Health check
   curl https://tj-cron-api.vercel.app/api/cron/health
   
   # With auth
   curl -X POST https://tj-cron-api.vercel.app/api/cron/hourly-update \
     -H "x-api-key: YOUR_CRON_API_KEY"
   ```

4. **Update cron-job.org** with new Vercel URLs

## Endpoints

- `GET /api/cron/health` - Health check (no auth)
- `POST /api/cron/ff-high-impact` - Check for high-impact events
- `POST /api/cron/ff-full-refresh` - Full calendar refresh
- `POST /api/cron/hourly-update` - Update bias calculations
