# 🚀 Deploy PipAura Automated Bias System to Vercel

## ✅ Status: Code Ready for Deployment

All fixes are complete and tested locally:
- ✅ RapidAPI calendar integration working
- ✅ Economic score normalization fixed (±10 range)
- ✅ Database upsert logic corrected
- ✅ All 3 cron endpoints tested successfully

## 📋 Deployment Steps

### Step 1: Push Code to Git

Your Vercel deployment auto-deploys from your Git repository. Push the latest code:

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix fundamental bias scoring: normalized economic scores, corrected upsert logic, RapidAPI integration"

# Push to your main branch (adjust branch name if different)
git push origin main
```

### Step 2: Verify Environment Variables on Vercel

Make sure these environment variables are set in your Vercel project:

**Required Variables:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)
- `RAPIDAPI_KEY` - Your RapidAPI key for economic calendar
- `CRON_API_KEY` - API key for securing cron endpoints (matches what's in cron-job.org)

**To add/verify variables:**
1. Go to https://vercel.com/dashboard
2. Select your PipAura project
3. Go to Settings → Environment Variables
4. Add any missing variables for **Production** environment

### Step 3: Wait for Deployment

Vercel will automatically:
1. Detect your Git push
2. Build your application
3. Deploy to production (usually takes 1-3 minutes)

**Monitor deployment:**
- Go to Vercel Dashboard → Deployments
- Watch the build log for any errors
- Wait for "Ready" status

### Step 4: Verify Cron Endpoints are Working

Once deployed, test your cron endpoints:

**Test High-Impact Check:**
```bash
curl -X POST https://pipaura-git-main-deviltrades-projects.vercel.app/api/cron/ff-high-impact \
  -H "x-api-key: YOUR_CRON_API_KEY"
```

**Test Hourly Update:**
```bash
curl -X POST https://pipaura-git-main-deviltrades-projects.vercel.app/api/cron/hourly-update \
  -H "x-api-key: YOUR_CRON_API_KEY"
```

**Test Full Refresh:**
```bash
curl -X POST https://pipaura-git-main-deviltrades-projects.vercel.app/api/cron/ff-full-refresh \
  -H "x-api-key: YOUR_CRON_API_KEY"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Hourly bias update completed"
}
```

### Step 5: Confirm Automated Updates are Working

Your cron-job.org scheduler should already be configured with:

1. **Every 15 minutes** → `/api/cron/ff-high-impact`
   - Checks for high-impact events with actual values
   - Triggers instant bias recalculation if detected

2. **Every 30 minutes** → `/api/cron/hourly-update`
   - Updates all currency scores
   - Recalculates 38 FX pairs + 10 indices

3. **Every 4 hours** → `/api/cron/ff-full-refresh`
   - Full RapidAPI calendar refresh
   - Fetches 14 days historical + 7 days future events

**To verify automation:**
1. Wait 30 minutes after deployment
2. Check your Supabase database:
   - `currency_scores` table should have new entries
   - `fundamental_bias` table should be updated
   - Check `window_end` timestamp to confirm fresh data
3. Check your frontend → Fundamentals page
   - Bias scores should reflect economic data
   - Currency scores should show breakdown (Data, CB, Commodity, Market)

## 🎯 Success Criteria

After deployment, you should see:

✅ **Vercel Deployment:** "Ready" status in dashboard  
✅ **Cron Endpoints:** Return `{"success": true}` when tested  
✅ **Database Updates:** New `window_end` timestamps every 30 mins  
✅ **Frontend Display:** Bias scores include economic data  
✅ **Automation:** No manual intervention needed - updates happen automatically  

## 🐛 Troubleshooting

**If cron endpoints return errors:**
- Check Vercel deployment logs for build errors
- Verify all environment variables are set
- Ensure `CRON_API_KEY` matches what's configured in cron-job.org

**If database isn't updating:**
- Check Vercel function logs (Dashboard → Functions)
- Verify Supabase credentials are correct
- Test endpoints manually using curl commands above

**If economic scores are still 0:**
- Check RapidAPI key is valid and has credits
- Verify `forex_events` table has data
- Run full refresh endpoint manually

## 📊 Current Local Test Results

All endpoints tested successfully with these results:

**Currency Scores (with economic data):**
- USD: Total=13 (Economic=10, CB=3) ✅
- EUR: Total=-2 (Economic=-2) ✅
- GBP: Total=3 (Economic=3) ✅
- JPY: Total=-2 (Economic=-1, CB=-3) ✅

**FX Bias Examples:**
- EUR/USD: +15 (Fundamentally Strong) ✅
- GBP/USD: +10 (Fundamentally Strong) ✅
- USD/JPY: -15 (Fundamentally Weak) ✅
- NZD/JPY: -2 (Neutral) ✅

## 🔒 Security Note

Your `CRON_API_KEY` protects the endpoints from unauthorized access. Make sure:
- It's a strong random string
- It's set identically in both Vercel and cron-job.org
- Never commit it to Git or expose it publicly

---

**Next Step:** Run `git push` and watch your automated bias system go live! 🚀
