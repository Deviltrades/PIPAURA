# Email Not Sending - Troubleshooting Guide

## Issue: Password Setup Email Not Received After Payment

After a successful Stripe payment, users should receive a password setup email to access their account. If this isn't happening, follow these steps:

---

## ✅ What I Just Fixed

Updated the webhook to **ALWAYS** send password reset emails (not just for new accounts). The email will now send for:
- New account signups via payment
- Existing users re-subscribing
- Any payment completion

---

## 🔍 Step 1: Check Supabase Email Configuration

### Go to Supabase Dashboard:

1. **Navigate to:** https://supabase.com/dashboard/project/YOUR_PROJECT/auth/templates
2. **Check Email Templates** are enabled:
   - Reset Password template
   - Confirm Email template

### Required Email Template Settings:

**Template: "Reset Password"**
```
Subject: Set up your PipAura account password

Body should include:
<a href="{{ .ConfirmationURL }}">Set up your password</a>
```

**Template: "Confirm Signup"** (if using email confirmation)
```
Subject: Welcome to PipAura!

Body should include:
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```

---

## 🔧 Step 2: Check Email Provider Settings

### Using Supabase's Built-in Email (Default):

**Limitations:**
- Only works for first 4-5 emails
- Rate limited heavily
- Often goes to spam
- **Not suitable for production**

### Recommended: Use Custom SMTP

**Go to:** Settings → Auth → SMTP Settings

**Recommended Providers:**
1. **SendGrid** (free tier: 100 emails/day)
2. **Mailgun** (free tier: 100 emails/day)
3. **AWS SES** (cheap, reliable)
4. **Resend** (modern, developer-friendly)

**Example SendGrid Configuration:**
```
Enable Custom SMTP: ON
Sender email: noreply@pipaura.com
Sender name: PipAura
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API key]
```

---

## 📧 Step 3: Test Email Manually

### In Supabase Dashboard:

1. Go to **Authentication → Users**
2. Click **Add User**
3. Enter a test email
4. Enable **Auto Confirm User: OFF**
5. Click **Create User**
6. Check if confirmation email arrives

If NO email arrives → Supabase email is not configured correctly.

---

## 🔍 Step 4: Check Vercel Webhook Logs

Since you're testing on production (pipaura.com), the webhook logs are in **Vercel**, not Replit.

### How to Check Vercel Logs:

1. Go to: https://vercel.com/dashboard
2. Select your **PipAura** project
3. Click **Logs** (top navigation)
4. Filter by: `api/webhooks/stripe`
5. Look for recent activity

### What to Look For:

✅ **Success logs:**
```
Received Stripe webhook event: checkout.session.completed
✅ Created new Supabase Auth user for user@email.com
📧 Password setup email sent successfully to user@email.com
```

❌ **Error logs:**
```
❌ CRITICAL: Failed to send password setup email to user@email.com
```

If you see the error log, check the error details to diagnose.

---

## 🐛 Step 5: Common Issues & Fixes

### Issue 1: "Email rate limit exceeded"

**Cause:** Supabase default email has strict limits (4-5 emails total)

**Fix:** Set up custom SMTP provider (SendGrid, Mailgun, etc.)

---

### Issue 2: "Invalid redirect URL"

**Cause:** The redirect URL doesn't match your Site URL in Supabase

**Fix:**
1. Go to: **Authentication → URL Configuration**
2. Add to **Redirect URLs:**
   - `https://pipaura.com/reset-password`
   - `https://www.pipaura.com/reset-password`
3. Set **Site URL:** `https://pipaura.com`

---

### Issue 3: Emails going to spam

**Cause:** Using Supabase's default email sender

**Fix:** 
1. Set up custom SMTP with your own domain
2. Add SPF, DKIM, DMARC records to DNS
3. Use a verified sending domain

---

### Issue 4: "User already exists"

**Cause:** User previously signed up but didn't complete setup

**Fix:** The webhook now sends email regardless of account status. If still not working, manually trigger:

**In Supabase SQL Editor, run:**
```sql
-- Find the user
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'user@example.com';

-- Manually send password reset (if needed)
-- This requires using Supabase Admin API or manually resending from dashboard
```

---

## 🧪 Step 6: Test the Full Flow

### Manual Test Process:

1. **Clear test data:**
   - Delete any test users from Supabase Auth
   - Clear test subscriptions from Stripe

2. **Make a test payment:**
   - Go to: https://pipaura.com/pricing
   - Click on Lite plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete checkout

3. **Check Vercel logs immediately:**
   - Should see webhook processing
   - Should see email sent confirmation

4. **Check email inbox:**
   - Check inbox for password setup email
   - Check spam/junk folder
   - Check Promotions tab (if Gmail)

5. **If no email after 2 minutes:**
   - Something is wrong with Supabase email config

---

## 🚨 Quick Fix: Manual Password Reset

If you need to give a paying customer immediate access:

### Option 1: Send Manual Password Reset

**In Supabase Dashboard:**
1. Go to **Authentication → Users**
2. Find the user by email
3. Click the **...** menu
4. Select **Send password reset email**

### Option 2: Set Temporary Password (Not Recommended)

**In Supabase SQL Editor:**
```sql
-- WARNING: Only for emergency access
-- User will need to change password after logging in

UPDATE auth.users 
SET encrypted_password = crypt('TemporaryPass123!', gen_salt('bf'))
WHERE email = 'user@example.com';
```

---

## 📊 How to Monitor Going Forward

### Set Up Webhook Monitoring:

1. **Vercel Logs:**
   - Check daily for email send failures
   - Set up log alerts for "CRITICAL" errors

2. **Supabase Dashboard:**
   - Monitor Auth users for accounts without confirmed emails
   - Check SMTP settings regularly

3. **Stripe Dashboard:**
   - Verify webhooks are being delivered
   - Check webhook retry attempts

---

## 🎯 Recommended Production Setup

### For Reliable Email Delivery:

1. **Use SendGrid Free Tier:**
   - 100 emails/day (plenty for starting out)
   - Easy setup (5 minutes)
   - Good deliverability

2. **Configure Custom Domain:**
   - Use noreply@pipaura.com instead of Supabase default
   - Add SPF/DKIM records
   - Verify domain in SendGrid

3. **Test Email Flow:**
   - Sign up yourself
   - Verify email arrives in <1 minute
   - Check it doesn't go to spam

4. **Monitor Deliverability:**
   - Check SendGrid dashboard weekly
   - Track bounce/spam rates
   - Maintain good sender reputation

---

## 📝 Immediate Action Items

### To fix email issue RIGHT NOW:

1. ✅ **Deploy updated webhook** (already done - code updated)

2. ⏳ **Check Supabase Auth Settings:**
   - Go to Authentication → Email Templates
   - Verify "Reset Password" template exists
   - Check redirect URLs include `https://pipaura.com/reset-password`

3. ⏳ **Set up SMTP (if not done):**
   - Recommended: SendGrid (free, quick setup)
   - Add SMTP credentials to Supabase
   - Test by creating a new user

4. ⏳ **Test the flow:**
   - Make a test payment
   - Check Vercel logs
   - Verify email arrives

5. ⏳ **For existing customer:**
   - Manually send password reset from Supabase dashboard
   - Or provide temporary login instructions

---

## 🆘 Still Not Working?

If you've checked all of the above and emails still aren't sending:

1. **Check Supabase service status:** https://status.supabase.com
2. **Verify environment variables are set in Vercel:**
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Check webhook signature verification:**
   - Ensure `STRIPE_WEBHOOK_SECRET` is correct
4. **Test with a different email provider:**
   - Sometimes ISPs block certain senders
   - Try Gmail, Outlook, and ProtonMail

---

**Next Steps:** Check your Supabase email configuration and Vercel webhook logs to diagnose the issue.
