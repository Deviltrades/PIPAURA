# Stripe Webhook Setup Guide

This guide will help you set up Stripe webhooks to automatically update user subscriptions when they make a payment.

## 🎯 What This Does

When a user subscribes to a plan (Lite, Core, or Elite), the webhook automatically:
- ✅ Updates their `plan_type` in the database
- ✅ Sets the correct storage limits (1GB, 2GB, or 10GB)
- ✅ Sets the correct account limits (1, 10, or unlimited)
- ✅ Handles subscription cancellations by downgrading users back to Lite

---

## 📋 Prerequisites

Before you begin, make sure you have:
- ✅ A Stripe account with API keys configured
- ✅ Your application deployed and accessible via a public URL
- ✅ `STRIPE_SECRET_KEY` already set in your environment variables

---

## 🔧 Setup Steps

### Step 1: Get Your Webhook Endpoint URL

Your webhook endpoint is located at:
```
https://your-domain.replit.app/api/webhooks/stripe
```

Replace `your-domain` with your actual Replit deployment URL.

---

### Step 2: Create a Webhook in Stripe Dashboard

1. **Log in to Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/webhooks

2. **Add Endpoint**
   - Click "Add endpoint" button
   - Enter your webhook URL: `https://your-domain.replit.app/api/webhooks/stripe`

3. **Select Events to Listen For**
   Add these three events:
   - `checkout.session.completed` - When a user completes payment
   - `customer.subscription.created` - When a subscription is created
   - `customer.subscription.deleted` - When a subscription is cancelled

4. **Save the Endpoint**
   - Click "Add endpoint" to save

---

### Step 3: Get Your Webhook Signing Secret

After creating the endpoint:

1. Click on the newly created endpoint in the Stripe dashboard
2. Look for the **"Signing secret"** section
3. Click "Reveal" to show the secret
4. Copy the secret (it starts with `whsec_...`)

---

### Step 4: Add the Webhook Secret to Your Environment

Add the webhook secret to your Replit secrets:

1. Open your Replit project
2. Click on "Tools" → "Secrets"
3. Add a new secret:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_xxxxxxxxxxxxx` (paste your signing secret)

---

### Step 5: Restart Your Application

After adding the secret:
1. Restart your application workflow
2. The webhook endpoint will now verify incoming requests from Stripe

---

## ✅ Testing Your Webhook

### Test with Stripe CLI (Recommended)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward events to your local server:
   ```bash
   stripe listen --forward-to https://your-domain.replit.app/api/webhooks/stripe
   ```
4. Trigger a test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Test with a Real Payment (Production)

1. Go to your pricing page
2. Click "Subscribe" on any plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete the checkout
5. Check your database - the user's `plan_type` should be updated!

---

## 🔍 Monitoring Webhooks

### Check Webhook Logs in Stripe

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your endpoint
3. View "Recent events" to see all webhook deliveries
4. Click on any event to see the request/response details

### Check Server Logs

When a webhook is received, you'll see logs like:
```
💳 Checkout completed: cs_xxxxxxxxxxxxx
✅ Updated user email@example.com to elite plan
```

If there's an error:
```
❌ Failed to update user plan: [error details]
⚠️ No user found with email email@example.com
```

---

## 🐛 Troubleshooting

### Webhook Returns 500 Error

**Possible causes:**
- Missing `STRIPE_WEBHOOK_SECRET` environment variable
- Supabase credentials not configured
- User doesn't exist in database

**Solution:**
1. Check that `STRIPE_WEBHOOK_SECRET` is set correctly
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Check server logs for detailed error messages

### User Plan Not Updating

**Possible causes:**
- Webhook not receiving events
- Email mismatch between Stripe and Supabase
- Events not configured in Stripe

**Solution:**
1. Check Stripe webhook dashboard for delivery status
2. Ensure user's email in Supabase matches Stripe checkout email
3. Verify you selected the correct events in Stripe

### Signature Verification Failed

**Possible causes:**
- Wrong webhook secret
- Webhook secret not set

**Solution:**
1. Double-check the `STRIPE_WEBHOOK_SECRET` value
2. Make sure you copied the entire secret from Stripe dashboard
3. Restart the application after updating the secret

---

## 📊 Webhook Event Flow

```
User completes checkout
       ↓
Stripe sends webhook to /api/webhooks/stripe
       ↓
Server verifies signature with STRIPE_WEBHOOK_SECRET
       ↓
Server extracts customer email and plan_type
       ↓
Server updates user_profiles in Supabase
       ↓
User's plan, storage limits, and account limits updated
       ↓
✅ Done!
```

---

## 🔐 Security Notes

- ✅ **Always verify webhook signatures** - This is already implemented
- ✅ **Use HTTPS in production** - Required for Stripe webhooks
- ✅ **Never expose webhook secrets** - Keep them in environment variables
- ✅ **Test in test mode first** - Use Stripe test mode before going live

---

## 📝 Next Steps

After setup is complete:

1. ✅ Test the webhook with a test payment
2. ✅ Monitor webhook logs for a few days
3. ✅ Switch to live mode when ready
4. ✅ Update webhook endpoint URL to production domain

---

## 🆘 Support

If you encounter issues:
- Check Stripe webhook logs
- Check server logs
- Verify all environment variables are set
- Test with Stripe CLI for local debugging

Happy coding! 🚀
