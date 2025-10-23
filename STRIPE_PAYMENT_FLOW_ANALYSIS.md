# PipAura Stripe Payment Flow - Complete Analysis

## 🧩 1️⃣ Full Payment Journey

### Complete User Flow (Payment-First Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User clicks "Subscribe" button                         │
│ Location: /pricing page → /checkout page                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: User selects plan & interval                           │
│ - Plan: Lite (£4.99) / Core (£14) / Elite (£24)               │
│ - Interval: Monthly or Yearly (17% savings)                    │
│ - Clicks "Proceed to Payment"                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Frontend calls API                                     │
│ POST /api/create-checkout-session                              │
│ Payload: { planId: "core", interval: "monthly" }              │
│ ⚠️ NO AUTHENTICATION REQUIRED - Payment-first flow              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Stripe Checkout Session Created                        │
│ API creates session with:                                       │
│ - Amount: £14.00 (1400 pence)                                  │
│ - Metadata: { planId: "core", interval: "monthly" }           │
│ - success_url: https://pipaura.com/payment-success?session_id={ID}│
│ - cancel_url: https://pipaura.com/pricing                      │
│ - Mode: subscription                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: User redirected to Stripe Checkout                     │
│ Stripe collects:                                                │
│ - Email address                                                 │
│ - Card details                                                  │
│ - Billing address                                               │
│ - User can cancel here (goes back to /pricing)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: User submits payment                                   │
│ Stripe processes card                                           │
│ If successful → webhook fires                                   │
│ If failed → user sees error, stays on checkout                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Stripe sends webhook to backend                        │
│ Event: checkout.session.completed                              │
│ POST https://pipaura.vercel.app/api/webhooks/stripe            │
│ ⚠️ This happens EVEN IF USER CLOSES BROWSER                     │
│ Stripe retries for 3 days if webhook fails                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Backend creates account automatically                  │
│ Function: createOrUpdateUserPlan(email, planId)                │
│                                                                  │
│ 1. Check if user profile exists by email                       │
│    ├─ EXISTS → Update plan_type and limits                     │
│    └─ NEW → Create Supabase Auth account                       │
│                                                                  │
│ 2. Create Supabase Auth user (Admin API)                       │
│    - Email: customer@email.com                                  │
│    - email_confirm: true (auto-confirmed)                      │
│    - user_metadata: { plan_type: "core" }                      │
│                                                                  │
│ 3. Create user_profiles record                                 │
│    - plan_type: "core"                                          │
│    - storage_limit_mb: 2048                                     │
│    - account_limit: 10                                          │
│    - image_limit: 999999                                        │
│                                                                  │
│ 4. Send password setup email                                   │
│    - Uses supabase.auth.resetPasswordForEmail()                │
│    - Redirects to: https://pipaura.com/reset-password          │
│    - Subject: "Reset Your Password" (Supabase default)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: User redirected to success page                        │
│ URL: https://pipaura.com/payment-success?session_id=cs_XXX     │
│                                                                  │
│ Page waits 2 seconds for webhook to complete                   │
│ Shows loading: "Processing your subscription..."               │
│ Then displays success message with plan details                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 10: User receives emails                                  │
│ 1. Stripe payment confirmation (if enabled)                    │
│ 2. Stripe invoice/receipt (if enabled)                         │
│ 3. Password setup email from Supabase                          │
│    - "Reset Your Password" email                               │
│    - Contains link to set password                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 11: User sets password                                    │
│ 1. User clicks link in "Reset Password" email                  │
│ 2. Redirected to https://pipaura.com/reset-password            │
│ 3. User enters new password                                    │
│ 4. Account is now fully activated                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 12: User logs in                                          │
│ 1. Go to /login                                                 │
│ 2. Enter email + password                                       │
│ 3. Access full app with Core plan features                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 2️⃣ Email & Confirmation Events

### Current Stripe Email Settings Status

**⚠️ ACTION REQUIRED**: Stripe emails need to be configured in Stripe Dashboard

### How to Enable Stripe Emails

1. Go to: **Stripe Dashboard → Settings → Emails**
2. Enable these emails:

#### ✅ Successful Payment Emails
- **Payment confirmations** - Sent when payment succeeds
- **Receipts** - Sent after successful invoice payment
- **Subscription confirmations** - Sent when subscription created

#### ✅ Failed Payment Emails
- **Failed payments** - Sent when payment fails
- **Failed recurring payments** - Sent when subscription renewal fails

#### ✅ Subscription Lifecycle Emails
- **Upcoming renewals** - Sent 3-7 days before renewal
- **Subscription cancellations** - Sent when user cancels
- **Subscription updates** - Sent when plan changes

### Current Email Flow

**Emails Currently Sent:**
1. ✅ **Password Setup Email** (Supabase)
   - Sent by: `supabase.auth.resetPasswordForEmail()`
   - Subject: "Reset Your Password" (Supabase default template)
   - Redirects to: `https://pipaura.com/reset-password`
   - Sent in: `api/webhooks/stripe.ts` line 167-175

2. ⚠️ **Stripe Payment Emails** (needs configuration)
   - Sent by: Stripe (if enabled in dashboard)
   - Currently: Unknown if enabled

### Customizing Supabase Email Templates

**Location**: Supabase Dashboard → Authentication → Email Templates

You can customize:
- **Subject line**: Change from "Reset Your Password" to "Welcome to PipAura - Set Your Password"
- **Email body**: Add branding, plan details, welcome message
- **Link text**: Change "Reset Password" to "Activate Your Account"

---

## 🧩 3️⃣ Failed Payment Logic

### Current Status: ⚠️ MISSING HANDLER

**Current Webhook Events Handled:**
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ❌ `invoice.payment_failed` - **NOT HANDLED**
- ❌ `invoice.payment_action_required` - **NOT HANDLED**

### What Happens When Payment Fails?

**Current Behavior:**
1. Stripe sends `invoice.payment_failed` webhook
2. Webhook arrives at `/api/webhooks/stripe`
3. Event is logged but **NOT PROCESSED** (see line 284: "Unhandled event type")
4. User continues with current plan access
5. **NO DOWNGRADE HAPPENS**
6. **NO USER NOTIFICATION**

### Recommended Failed Payment Handling

Add this to `api/webhooks/stripe.ts`:

```typescript
case 'invoice.payment_failed': {
  const invoice = event.data.object as Stripe.Invoice;
  console.log('Payment failed for invoice:', invoice.id);

  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);

  if ('deleted' in customer && customer.deleted) {
    console.error('Customer was deleted');
    return res.status(400).json({ error: 'Customer was deleted' });
  }

  const customerEmail = customer.email;
  if (!customerEmail) {
    console.error('No customer email found');
    return res.status(400).json({ error: 'No customer email found' });
  }

  // Downgrade to Lite after failed payment
  await createOrUpdateUserPlan(customerEmail, 'lite');
  console.log(`⚠️ Downgraded ${customerEmail} to lite plan after payment failure`);

  // TODO: Send email notification to user
  // Consider using Supabase or SendGrid to notify user

  break;
}
```

**Logic Options:**

**Option 1: Immediate Downgrade**
- First failed payment → downgrade to Lite immediately
- Pros: Enforces payment
- Cons: Harsh, user loses access quickly

**Option 2: Grace Period**
- First failed payment → send warning email
- Second failed payment → downgrade to Lite
- Pros: User-friendly, gives second chance
- Cons: More complex to track

**Option 3: Stripe Smart Retries (Recommended)**
- Let Stripe handle retries automatically (3-4 attempts)
- Only downgrade after final retry failure
- Use: `invoice.payment_failed` with `attempt_count` check

---

## 🧩 4️⃣ Canceled or Abandoned Checkout

### Current Handling: ✅ PROPERLY CONFIGURED

**What Happens When User Cancels:**

1. User opens Stripe Checkout
2. User clicks "Back" or closes tab
3. **Stripe redirects to:** `https://pipaura.com/pricing`
4. **Frontend shows:** Pricing page again
5. **No account created**, no webhook fired

**Configuration:**
- File: `api/create-checkout-session.ts` line 77
- URL: `cancel_url: ${origin}/pricing`
- Works for: Both manual cancel AND browser close

**User Experience:**
```
User → Clicks "Subscribe" → Stripe Checkout
         ↓ (cancels)
User → Back to /pricing page → Can try again
```

**Edge Cases Handled:**
- ✅ Browser close → Redirects to `/pricing` on next visit
- ✅ Back button → Immediate redirect to `/pricing`
- ✅ Multiple attempts → User can restart checkout flow

---

## 🧩 5️⃣ Refunds or Disputes

### Current Status: ⚠️ NOT HANDLED

**Missing Webhook Handlers:**
- ❌ `charge.refunded` - NOT HANDLED
- ❌ `charge.dispute.created` - NOT HANDLED
- ❌ `charge.dispute.closed` - NOT HANDLED

### What Happens Currently:

**When Refund Issued:**
1. Admin issues refund in Stripe Dashboard
2. Stripe sends `charge.refunded` webhook
3. Webhook logs: "Unhandled event type: charge.refunded"
4. **User keeps access to paid plan** ❌
5. **No admin notification** ❌

**When Dispute Filed:**
1. Customer disputes charge with bank
2. Stripe sends `charge.dispute.created` webhook
3. Webhook logs: "Unhandled event type"
4. **No admin notification** ❌

### Recommended Implementation

Add to `api/webhooks/stripe.ts`:

```typescript
case 'charge.refunded': {
  const charge = event.data.object as Stripe.Charge;
  console.log('⚠️ Refund issued for charge:', charge.id);

  // Get customer email from charge
  const customerId = charge.customer as string;
  if (!customerId) {
    console.error('No customer ID in refunded charge');
    break;
  }

  const customer = await stripe.customers.retrieve(customerId);
  if ('deleted' in customer && customer.deleted) break;

  const customerEmail = customer.email;
  if (customerEmail) {
    // Downgrade to Lite after refund
    await createOrUpdateUserPlan(customerEmail, 'lite');
    console.log(`🔄 Downgraded ${customerEmail} to lite plan after refund`);
  }

  // TODO: Send email to admin@pipaura.com
  console.log(`📧 Admin notification needed: Refund for ${customerEmail}`);
  break;
}

case 'charge.dispute.created': {
  const dispute = event.data.object as Stripe.Dispute;
  console.log('⚠️ DISPUTE CREATED:', dispute.id);
  console.log(`Amount: £${(dispute.amount / 100).toFixed(2)}`);
  console.log(`Reason: ${dispute.reason}`);

  // TODO: Send urgent email to admin@pipaura.com
  // Include: dispute ID, amount, reason, customer email
  console.log('📧 URGENT: Admin notification needed for dispute');
  break;
}
```

**Admin Notification Options:**
1. Use SendGrid/Postmark to email `admin@pipaura.com`
2. Use Slack webhook for real-time alerts
3. Log to error tracking service (Sentry)

---

## 🧩 6️⃣ Subscription Lifecycle - All Webhook Events

### Currently Handled Events (4 total)

#### 1. `checkout.session.completed` ✅
**File**: `api/webhooks/stripe.ts` lines 207-226

**When Fired:**
- User completes payment on Stripe Checkout
- Immediately after successful card charge

**Actions Taken:**
1. Extract customer email from session
2. Extract planId from session metadata
3. Call `createOrUpdateUserPlan(email, planId)`
4. Create/update account with correct limits

**Example Log:**
```
✅ Checkout completed for user@email.com, plan: core
📝 Creating new account for user@email.com with core plan
✅ Created new Supabase Auth user, ID: abc-123
📧 Sent password setup email to user@email.com
```

---

#### 2. `customer.subscription.created` ✅
**File**: `api/webhooks/stripe.ts` lines 229-257

**When Fired:**
- Stripe creates subscription after successful checkout
- Usually fires ~1 second after `checkout.session.completed`

**Actions Taken:**
1. Retrieve customer by ID
2. Infer planId from subscription amount (£14 → core)
3. Call `createOrUpdateUserPlan(email, planId)`

**Example Log:**
```
Subscription customer.subscription.created: sub_XXX
✅ Subscription customer.subscription.created for user@email.com, plan: core
```

**Note:** This is redundant with `checkout.session.completed` but serves as a safety net.

---

#### 3. `customer.subscription.updated` ✅
**File**: `api/webhooks/stripe.ts` lines 229-257

**When Fired:**
- User upgrades from Lite → Core
- User downgrades from Elite → Core
- Subscription renews successfully
- Payment method updated

**Actions Taken:**
1. Retrieve customer and subscription details
2. Determine new plan from subscription amount
3. Update user_profiles with new plan_type and limits

**Example Log:**
```
Subscription customer.subscription.updated: sub_XXX
✅ Updated existing user user@email.com to elite plan
```

**Use Cases:**
- Upgrade: Lite user subscribes to Core → limits increase
- Downgrade: Elite user cancels, switches to Lite → limits decrease
- Renewal: Monthly subscription renews → no change

---

#### 4. `customer.subscription.deleted` ✅
**File**: `api/webhooks/stripe.ts` lines 260-281

**When Fired:**
- User cancels subscription
- Subscription expires (end of billing period)
- Multiple failed payments → Stripe cancels

**Actions Taken:**
1. Retrieve customer email
2. Downgrade to 'lite' plan (free tier)
3. Update limits: 1 account, 1GB storage

**Example Log:**
```
Subscription cancelled: sub_XXX
⬇️ Downgraded user@email.com to lite plan after cancellation
```

**Important:** User can still log in and use Lite features.

---

### Missing / Unhandled Events ❌

#### 5. `invoice.payment_failed` ❌ NOT HANDLED
**When Fired:**
- Subscription renewal payment fails
- Card declined, expired, or insufficient funds

**Should Do:**
- Downgrade to Lite after X failed attempts
- Send email notification to user
- Log failure for admin review

---

#### 6. `invoice.payment_succeeded` ❌ NOT HANDLED
**When Fired:**
- Successful subscription renewal
- First payment (overlaps with checkout.session.completed)

**Could Do:**
- Log renewal for analytics
- Send "Payment received" email
- Update last_payment_date in user_profiles

---

#### 7. `charge.refunded` ❌ NOT HANDLED
**When Fired:**
- Admin issues full or partial refund
- Dispute resolved in customer's favor

**Should Do:**
- Downgrade user to Lite
- Email admin@pipaura.com with details
- Log refund reason

---

#### 8. `charge.dispute.created` ❌ NOT HANDLED
**When Fired:**
- Customer disputes charge with bank (chargeback)

**Should Do:**
- **URGENT** email to admin@pipaura.com
- Log all dispute details
- Potentially suspend account

---

#### 9. `customer.updated` (Optional)
**When Fired:**
- Customer email changes
- Billing details updated

**Could Do:**
- Sync email changes to user_profiles
- Update billing_email field

---

### Summary Table

| Event | Status | Impact | Priority |
|-------|--------|--------|----------|
| `checkout.session.completed` | ✅ Handled | Creates account | Critical |
| `customer.subscription.created` | ✅ Handled | Safety net | Medium |
| `customer.subscription.updated` | ✅ Handled | Plan changes | Critical |
| `customer.subscription.deleted` | ✅ Handled | Cancellations | Critical |
| `invoice.payment_failed` | ❌ Missing | Failed payments | **HIGH** |
| `invoice.payment_succeeded` | ❌ Missing | Renewals | Low |
| `charge.refunded` | ❌ Missing | Refunds | **HIGH** |
| `charge.dispute.created` | ❌ Missing | Disputes | **HIGH** |
| `customer.updated` | ❌ Missing | Email changes | Low |

---

## 🧩 7️⃣ User Experience After Payment

### Success Page Experience

**URL**: `https://pipaura.com/payment-success?session_id=cs_XXX`

**File**: `client/src/pages/payment-success.tsx`

**Flow:**
1. User lands on page after Stripe redirect
2. Page shows loading state: "Processing your subscription..."
3. Waits 2 seconds for webhook to complete
4. Fetches user profile (which now has correct plan)
5. Displays success message with plan details

**On-Screen Confirmation Includes:**
- ✅ Green checkmark animation
- ✅ "Payment Successful!" message
- ✅ Plan name (e.g., "Welcome to PipAura Core")
- ✅ Active plan badge
- ✅ List of included features
- ✅ User email address
- ✅ Current plan type
- ✅ "What's Next?" guidance
- ✅ Two action buttons:
  - "Go to Dashboard" (primary)
  - "Manage Subscription" (secondary)

**User Sees:**
```
✅ Payment Successful! ✨
Welcome to PipAura Core

━━━━━━━━━━━━━━━━━━━━━━━━━
  Core Plan Active
━━━━━━━━━━━━━━━━━━━━━━━━━

Your subscription is now active and ready to use

You now have access to:
✓ Everything in Lite
✓ Advanced analytics & DNA Core
✓ Prop firm tracker
✓ Up to 10 accounts
✓ 2GB storage

Account Email: user@email.com
Plan Type: Core

What's Next?
• Start logging your trades
• Set up your trading accounts
• Explore analytics
• Manage subscription in Settings

[Go to Dashboard] [Manage Subscription]
```

### Email Experience

**Emails Received (in order):**

1. **Stripe Payment Confirmation** (if enabled)
   - From: Stripe
   - Subject: "Payment confirmation"
   - Content: Amount paid, plan name, receipt

2. **Stripe Invoice/Receipt** (if enabled)
   - From: Stripe
   - Subject: "Invoice from PipAura"
   - Content: Invoice PDF, payment details

3. **Password Setup Email** (Supabase)
   - From: noreply@pipaura.com (via Supabase)
   - Subject: "Reset Your Password"
   - Content: Link to set password
   - **Note**: This email says "Reset" but it's actually for initial setup

### Recommended Improvements

#### 1. Customize Supabase Email Template
**Current:** Generic "Reset Your Password"
**Better:** "Welcome to PipAura - Activate Your Account"

**Template Example:**
```
Subject: Welcome to PipAura {{ plan_name }} - Set Your Password

Hi there,

Welcome to PipAura! Your {{ plan_name }} subscription is now active.

To access your account, please set your password:
[Activate My Account] (button)

Your Plan: {{ plan_name }}
Email: {{ email }}

What's included:
• Feature 1
• Feature 2
• Feature 3

Questions? Reply to this email or visit our help center.

Best,
The PipAura Team
```

#### 2. Add Confirmation Email Logic
Currently relies 100% on Stripe's emails. Consider adding your own:

```typescript
// After creating account in webhook
await sendWelcomeEmail(customerEmail, planId);
```

#### 3. Show More Details on Success Page
Add:
- First invoice amount
- Next billing date
- Customer portal link
- Support contact info

---

## 🚨 Critical Actions Required

### Immediate (High Priority)

1. **Enable Stripe Email Notifications**
   - Go to Stripe Dashboard → Settings → Emails
   - Enable: Payment confirmations, Failed payments, Receipts

2. **Add Failed Payment Handler**
   - Implement `invoice.payment_failed` webhook
   - Downgrade users to Lite after failed renewals

3. **Add Refund Handler**
   - Implement `charge.refunded` webhook
   - Email admin when refunds occur

4. **Add Dispute Handler**
   - Implement `charge.dispute.created` webhook
   - Send urgent email to admin@pipaura.com

### Medium Priority

5. **Customize Supabase Email**
   - Change subject from "Reset Password" to "Activate Account"
   - Add branding and plan details

6. **Add Admin Notifications**
   - Set up SendGrid or Postmark
   - Email admin@pipaura.com for refunds/disputes

### Low Priority

7. **Add Analytics Tracking**
   - Track `invoice.payment_succeeded` for renewals
   - Monitor subscription churn rate

8. **Improve Success Page**
   - Show next billing date
   - Add customer portal link
   - Display first invoice amount

---

## 📊 Event Flow Diagram

```
New Signup:
checkout.session.completed → customer.subscription.created → Account created ✅

Monthly Renewal (Success):
invoice.payment_succeeded → customer.subscription.updated → No change

Monthly Renewal (Failure):
invoice.payment_failed → ⚠️ UNHANDLED → User keeps access ❌

Plan Upgrade:
User clicks upgrade → customer.subscription.updated → Limits increased ✅

Cancellation:
User cancels → customer.subscription.deleted → Downgrade to Lite ✅

Refund:
Admin refunds → charge.refunded → ⚠️ UNHANDLED → User keeps access ❌

Dispute:
Customer disputes → charge.dispute.created → ⚠️ UNHANDLED → No alert ❌
```

---

## ✅ What's Working Well

1. ✅ Payment-first architecture (no account before payment)
2. ✅ Automatic account creation via webhooks
3. ✅ Idempotent webhook handling (handles Stripe retries)
4. ✅ Password setup email sent automatically
5. ✅ Proper success/cancel URL redirects
6. ✅ Plan upgrades/downgrades work correctly
7. ✅ Subscription cancellations handled gracefully

## ⚠️ What Needs Fixing

1. ❌ Failed payment handling (users keep access)
2. ❌ Refund handling (users keep access)
3. ❌ Dispute handling (no admin notification)
4. ⚠️ Stripe email settings (unknown if enabled)
5. ⚠️ Password email wording ("Reset" vs "Activate")
6. ⚠️ No admin notifications for critical events

---

**Ready to implement improvements!** Let me know which fixes you'd like to prioritize.
