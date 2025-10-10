# cron-job.org Setup Guide - Free Scheduled Jobs

## ✅ What's Ready

Your bias automation scripts are now accessible via HTTP endpoints that cron-job.org can call:

- ✅ **Cron API Server** running on port 3001
- ✅ **API Key authentication** for security
- ✅ **4 endpoints** ready for scheduling

---

## 🔐 Step 1: Set Your API Key Secret

Your endpoints are protected with an API key. Set this up in Replit:

1. In Replit, click the **🔒 Secrets** tab (lock icon in left sidebar)
2. Click **+ New Secret**
3. Set:
   ```
   Key: CRON_API_KEY
   Value: [Create a strong random key, e.g., bias_cron_2025_your_random_string]
   ```
4. Click **Add new secret**

**Important**: Save this API key - you'll need it for cron-job.org setup!

---

## 📡 Your Webhook URLs

Your Replit app domain: `https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app`

### Available Endpoints:

1. **High-Impact Event Check** (every 15 min)
   ```
   https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/cron/ff-high-impact
   ```

2. **Full Calendar Refresh** (every 4 hours)
   ```
   https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/cron/ff-full-refresh
   ```

3. **Hourly Bias Update** (every 30 min or hourly)
   ```
   https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/cron/hourly-update
   ```

4. **Weekly Deep Analysis** (Sunday 00:00 UTC)
   ```
   https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/cron/weekly-analysis
   ```

---

## 🚀 Step 2: Create cron-job.org Account

1. Go to **https://cron-job.org**
2. Click **Sign Up** (free tier is sufficient)
3. Verify your email
4. Log in to your dashboard

---

## ⏰ Step 3: Create Scheduled Jobs

### Job 1: High-Impact Event Check (Every 15 Minutes)

1. In cron-job.org dashboard, click **Create cronjob**
2. Configure:
   ```
   Title: FF High-Impact Check
   Address: https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/cron/ff-high-impact
   
   Schedule: */15 * * * * (every 15 minutes)
   Or use picker: Every 15 minutes
   
   Request method: POST
   
   Request headers:
   x-api-key: [YOUR_API_KEY_FROM_SECRETS]
   
   Enabled: ✓
   ```
3. Click **Create cronjob**

### Job 2: Full Calendar Refresh (Every 4 Hours)

1. Click **Create cronjob**
2. Configure:
   ```
   Title: FF Full Refresh
   Address: https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/cron/ff-full-refresh
   
   Schedule: 0 */4 * * * (every 4 hours)
   Or use picker: Every 4 hours at minute 0
   
   Request method: POST
   
   Request headers:
   x-api-key: [YOUR_API_KEY_FROM_SECRETS]
   
   Enabled: ✓
   ```
3. Click **Create cronjob**

### Job 3: Hourly Bias Update (Every 30 Minutes)

1. Click **Create cronjob**
2. Configure:
   ```
   Title: Hourly Bias Update
   Address: https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/cron/hourly-update
   
   Schedule: */30 * * * * (every 30 minutes)
   Or use picker: Every 30 minutes
   
   Request method: POST
   
   Request headers:
   x-api-key: [YOUR_API_KEY_FROM_SECRETS]
   
   Enabled: ✓
   ```
3. Click **Create cronjob**

### Job 4: Weekly Deep Analysis (Sunday 00:00 UTC)

1. Click **Create cronjob**
2. Configure:
   ```
   Title: Weekly Analysis
   Address: https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/cron/weekly-analysis
   
   Schedule: 0 0 * * 0 (Sunday at 00:00 UTC)
   Or use picker: Every Sunday at 00:00
   
   Request method: POST
   
   Request headers:
   x-api-key: [YOUR_API_KEY_FROM_SECRETS]
   
   Enabled: ✓
   ```
3. Click **Create cronjob**

---

## 🔍 Step 4: Test Your Setup

### Test Health Check (No Auth Required)
```bash
curl https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/health
```

Expected response:
```json
{"status":"ok","message":"Cron API server running"}
```

### Test Authenticated Endpoint
```bash
curl -X POST \
  https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/cron/ff-high-impact \
  -H "x-api-key: YOUR_API_KEY"
```

Expected response:
```json
{
  "success": true,
  "message": "FF high-impact check completed",
  "output": "[2025-10-10 14:00:00 UTC] ForexFactory update → ..."
}
```

### Test Without Auth (Should Fail)
```bash
curl -X POST https://[YOUR-REPL-NAME].[YOUR-USERNAME].replit.app:3001/cron/ff-high-impact
```

Expected response:
```json
{"error":"Unauthorized - Invalid API key"}
```

---

## 📊 Monitoring Your Jobs

### In cron-job.org Dashboard:
- ✅ View execution history
- ✅ See success/failure rates
- ✅ Check response times
- ✅ Enable/disable jobs anytime

### In Replit Logs:
- Watch for `[CRON]` prefixed logs
- Monitor script output
- Check for errors

---

## 🎯 What Happens Now

Once all jobs are set up on cron-job.org:

1. **Every 15 min**: High-impact event check
   - New NFP/CPI/GDP → Instant bias recalc

2. **Every 30 min**: Real-time bias update
   - Market data + FF scores → FX pairs updated

3. **Every 4 hours**: Full calendar refresh
   - All events processed → Macro background

4. **Every Sunday 00:00 UTC**: Weekly deep analysis
   - All data sources → Comprehensive update

---

## 💡 Free Tier Limits

cron-job.org free tier includes:
- ✅ Up to 50 cron jobs
- ✅ 1-minute minimum interval
- ✅ Email notifications
- ✅ Execution history

Your 4 jobs fit perfectly within free limits!

---

## 🛡️ Security Features

✅ **API Key authentication** - Only authorized requests processed
✅ **Header-based auth** - API key in headers, not URL
✅ **POST requests only** - No accidental triggers via browser
✅ **Replit Secrets** - API key never exposed in code

---

## 🔧 Troubleshooting

### Issue: 401 Unauthorized
**Solution**: 
1. Check API key is set in Replit Secrets (CRON_API_KEY)
2. Verify API key matches in cron-job.org headers
3. Restart your Replit app to load new secret

### Issue: Connection timeout
**Solution**:
1. Ensure your Replit app is running (workflow active)
2. Check the URL matches your Replit domain
3. Verify port 3001 is accessible

### Issue: Script errors in response
**Solution**:
1. Check Replit logs for Python errors
2. Ensure all Python dependencies installed
3. Verify Supabase tables exist (forex_events, economic_scores)

### Issue: No data updates
**Solution**:
1. Check cron-job.org execution history
2. View response body for error messages
3. Manually test: `curl -X POST [url] -H "x-api-key: [key]"`

---

## 📈 Expected Performance

**Execution Times:**
- High-impact check: 2-5 seconds
- Full refresh: 5-10 seconds
- Hourly update: 5-10 seconds
- Weekly analysis: 10-30 seconds

**Data Freshness:**
- High-impact events: 15-min detection
- Market data: 30-min/hourly updates
- Economic calendar: 4-hour refresh
- Deep analysis: Weekly (Sunday)

---

## 🎉 You're All Set!

Your bias automation is now:
- ✅ **100% free** (no Replit deployment costs)
- ✅ **Fully automated** via cron-job.org
- ✅ **Secure** with API key auth
- ✅ **Event-aware** with Forex Factory integration
- ✅ **Market-aware** with real-time data

**Your complete automation stack runs without any deployment fees!** 🚀
