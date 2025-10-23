# Stripe Security Webhooks - Revenue Protection

## ✅ IMPLEMENTED - Critical Security Handlers

Your webhook system now includes comprehensive protection against payment failures, refunds, and disputes.

---

## 🛡️ Security Handlers Overview

### 1. **invoice.payment_failed** - Payment Failure Protection

**Purpose:** Prevents users from keeping paid access after their payment fails.

**What It Does:**
- Marks `subscription_status = 'past_due'`
- Keeps `plan_type` unchanged (allows Stripe retry attempts)
- Logs payment failure details for monitoring

**Flow:**
```
Payment fails → User marked as 'past_due'
                → Stripe retries automatically (up to 4 times)
                → If all retries fail → Stripe cancels subscription
                → subscription.deleted webhook fires
                → User downgraded to Lite
```

**Log Output:**
```
⚠️ PAYMENT FAILED: user@example.com - marked as past_due (Attempt 1)
   Invoice: in_1234567890, Amount: 14.00 GBP
```

**Frontend Handling:**
User sees "Payment failed - please update your payment method" banner.

---

### 2. **charge.refunded** - Refund Protection

**Purpose:** Immediately downgrades users who receive refunds (they got their money back).

**What It Does:**
- Downgrades to Lite plan immediately
- Logs detailed refund information
- Alerts admin for manual review

**Flow:**
```
Refund issued → User downgraded to Lite instantly
              → Admin notification logged
              → Subscription canceled (if active)
```

**Log Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 REFUND ALERT - ADMIN ACTION MAY BE REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: user@example.com
Previous Plan: core
Refund Amount: 14.00 GBP
Charge ID: ch_1234567890
Customer ID: cus_1234567890
Reason: requested_by_customer
Action Taken: Downgraded to Lite plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Why This Matters:**
Without this handler, users could:
1. Pay £14 for Core plan
2. Request refund from bank
3. Get their £14 back
4. Still have Core plan access
5. **Result:** You lose £14 + processing fees

---

### 3. **charge.dispute.created** - Chargeback Alert

**Purpose:** Immediate admin notification when customers dispute charges (chargebacks).

**What It Does:**
- Logs URGENT alert with all relevant details
- Provides direct link to Stripe dispute dashboard
- Tracks evidence deadline
- Does NOT immediately downgrade (wait for resolution)

**Flow:**
```
Dispute filed → URGENT admin alert logged
              → Admin reviews evidence
              → Submit response to Stripe
              → Wait for dispute resolution:
                 - Won: No action needed
                 - Lost: Stripe auto-refunds (charge.refunded fires)
```

**Log Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨🚨🚨 URGENT: PAYMENT DISPUTE CREATED 🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  IMMEDIATE ADMIN ATTENTION REQUIRED ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: user@example.com
Plan: core
Status: active
Dispute Amount: 14.00 GBP
Dispute Reason: fraudulent
Dispute ID: dp_1234567890
Charge ID: ch_1234567890
Customer ID: cus_1234567890
Customer Since: 2025-01-15T10:30:00.000Z
Dispute Status: needs_response
Evidence Due: 2025-02-01T23:59:59.000Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Action: Review in Stripe Dashboard immediately
Link: https://dashboard.stripe.com/disputes/dp_1234567890
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Why This Matters:**
- **Chargebacks cost £15-30 in fees** (even if you win)
- **High chargeback rates = Stripe account suspension**
- **You have limited time to respond** (7-14 days)
- **Evidence must be submitted quickly** to win

---

## 📊 Webhook Event Flow

### Scenario 1: Normal Payment Failure (Card Expired)

```
Day 1:  invoice.payment_failed
        → subscription_status: 'past_due'
        → User sees: "Update payment method"
        → Stripe retries automatically

Day 4:  invoice.payment_failed (Retry 2)
        → Still 'past_due'
        → Email sent to user

Day 7:  invoice.payment_failed (Retry 3)
        → Still 'past_due'

Day 10: invoice.payment_failed (Final retry)
        → Still 'past_due'

Day 11: customer.subscription.deleted
        → subscription_status: 'canceled'
        → User loses access after period_end
```

---

### Scenario 2: Refund Requested

```
User pays £14 for Core plan
                ↓
checkout.session.completed
→ User gets Core plan
                ↓
User requests refund
                ↓
charge.refunded
→ User downgraded to Lite instantly
→ Admin notified
→ Subscription canceled
```

**Revenue Impact:**
- Lost revenue: £14
- Stripe fees (non-refundable): ~£0.50
- Total cost: £14.50

---

### Scenario 3: Chargeback Filed

```
User pays £14 for Core plan
                ↓
checkout.session.completed
→ User gets Core plan
                ↓
30 days later: User files chargeback with bank
                ↓
charge.dispute.created
→ URGENT admin alert
→ User KEEPS access (innocent until proven guilty)
                ↓
Admin submits evidence to Stripe
                ↓
Bank decides:
  - Win: User keeps plan (legitimate customer)
  - Lose: charge.refunded fires
        → User downgraded to Lite
        → You lose £14 + £15 dispute fee
```

**Revenue Impact If Lost:**
- Lost revenue: £14
- Stripe dispute fee: £15
- Total cost: £29

---

## 🎯 Frontend Integration Needed

### Display Payment Status to Users

**File:** `client/src/utils/subscriptionStatus.ts`

Update the utility function to handle `past_due` status:

```typescript
export function hasActiveSubscription(profile: UserProfile | null): {
  hasAccess: boolean;
  message?: string;
  gracePeriodEnds?: string;
  requiresAction?: boolean;
} {
  if (!profile) {
    return { hasAccess: false, message: 'Not logged in' };
  }

  // Lite plan always has access (free tier)
  if (profile.plan_type === 'lite') {
    return { hasAccess: true };
  }

  // Active subscription = full access
  if (profile.subscription_status === 'active' || 
      profile.subscription_status === 'trialing') {
    return { hasAccess: true };
  }

  // PAST DUE - Payment failed, needs update
  if (profile.subscription_status === 'past_due') {
    return {
      hasAccess: true, // Keep access during retry period
      requiresAction: true,
      message: 'Payment failed. Please update your payment method to avoid losing access.'
    };
  }

  // Canceled subscription - check if grace period active
  if (profile.subscription_status === 'canceled') {
    if (!profile.current_period_end) {
      return { 
        hasAccess: false,
        message: 'Your subscription has expired. Upgrade to continue using premium features.'
      };
    }

    const periodEnd = new Date(profile.current_period_end);
    const now = new Date();

    if (now < periodEnd) {
      return {
        hasAccess: true,
        gracePeriodEnds: periodEnd.toLocaleDateString()
      };
    } else {
      return {
        hasAccess: false,
        message: `Your subscription expired on ${periodEnd.toLocaleDateString()}. Renew to continue.`
      };
    }
  }

  // Expired = no access
  if (profile.subscription_status === 'expired') {
    return {
      hasAccess: false,
      message: 'Your subscription has expired. Please renew to continue.'
    };
  }

  return { hasAccess: false };
}
```

---

### Payment Failed Banner Component

**File:** `client/src/components/PaymentFailedBanner.tsx` (NEW FILE)

```typescript
import { UserProfile } from "@/shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard } from "lucide-react";

export function PaymentFailedBanner({ profile }: { profile: UserProfile }) {
  if (profile.subscription_status !== 'past_due') {
    return null;
  }

  const handleUpdatePayment = async () => {
    // Redirect to Stripe Customer Portal to update payment method
    const response = await fetch('/api/stripe/customer-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl: window.location.href })
    });
    
    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    <Alert className="mb-6 border-red-500 bg-red-500/10">
      <AlertTriangle className="h-5 w-5 text-red-500" />
      <AlertTitle className="text-red-400 font-semibold">
        Payment Failed
      </AlertTitle>
      <AlertDescription className="text-slate-300">
        <p className="mb-3">
          We couldn't process your payment for the{" "}
          <span className="font-semibold text-white">{profile.plan_type}</span> plan.
          Please update your payment method to avoid losing access.
        </p>
        <Button 
          onClick={handleUpdatePayment}
          className="bg-red-500 hover:bg-red-600 text-white gap-2"
          size="sm"
        >
          <CreditCard className="h-4 w-4" />
          Update Payment Method
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

---

### Add to Dashboard

**File:** `client/src/pages/dashboard.tsx`

```typescript
import { PaymentFailedBanner } from "@/components/PaymentFailedBanner";

export default function Dashboard() {
  const { profile } = useUserProfile();

  return (
    <div className="container mx-auto p-6">
      {/* Payment failed warning */}
      {profile && <PaymentFailedBanner profile={profile} />}
      
      {/* Grace period banner if canceled */}
      {profile && profile.subscription_status === 'canceled' && (
        <GracePeriodBanner profile={profile} />
      )}
      
      {/* Normal dashboard content */}
      ...
    </div>
  );
}
```

---

## 🔍 Monitoring & Admin Actions

### How to Monitor Webhooks in Vercel

1. Go to **Vercel Dashboard**
2. Select your project
3. Click **Logs**
4. Filter for: `api/webhooks/stripe`

**Look for these patterns:**

✅ **Normal activity:**
```
Received Stripe webhook event: checkout.session.completed
✅ Created new Supabase Auth user for user@email.com
```

⚠️ **Payment issues:**
```
⚠️ PAYMENT FAILED: user@email.com - marked as past_due (Attempt 2)
```

🚨 **Revenue threats:**
```
🚨 REFUND ALERT - ADMIN ACTION MAY BE REQUIRED
Email: user@example.com
Refund Amount: 14.00 GBP
```

🚨🚨🚨 **URGENT:**
```
🚨🚨🚨 URGENT: PAYMENT DISPUTE CREATED 🚨🚨🚨
⚠️  IMMEDIATE ADMIN ATTENTION REQUIRED ⚠️
```

---

### Admin Response Checklist

#### When You See a Refund Alert:

1. ✅ Check Stripe Dashboard for refund reason
2. ✅ Review user's account activity
3. ✅ Determine if fraud or legitimate
4. ✅ If fraud: Ban user account
5. ✅ If legitimate: No action needed (already downgraded)

#### When You See a Dispute Alert:

1. 🚨 **IMMEDIATE:** Click the Stripe dashboard link
2. 🚨 Gather evidence:
   - Transaction records
   - Service delivery proof
   - Customer communication
   - Terms of Service agreement
3. 🚨 Submit evidence BEFORE deadline
4. 🚨 Monitor dispute status
5. 🚨 If lost: User auto-downgraded via charge.refunded

**Evidence Tips:**
- Screenshot of user's account showing active usage
- Export of their trading journal/analytics data
- IP address logs showing account access
- Email confirmations of subscription

---

## 🧪 Testing These Handlers

### Test in Stripe Dashboard

**Important:** Use **Test Mode** to avoid real charges!

#### Test Payment Failure:

1. Create subscription with test card: `4000 0000 0000 0341` (card fails after subscription created)
2. Wait for Stripe to attempt charge
3. Verify `invoice.payment_failed` webhook fires
4. Check user marked as `past_due` in database

#### Test Refund:

1. Create subscription with test card: `4242 4242 4242 4242`
2. In Stripe Dashboard → Payments → Find charge → Click "Refund"
3. Verify `charge.refunded` webhook fires
4. Check user downgraded to Lite in database
5. Check Vercel logs for admin alert

#### Test Dispute:

1. Create subscription with test card: `4000 0000 0000 0259` (disputes can be created)
2. In Stripe Dashboard → Create a test dispute
3. Verify `charge.dispute.created` webhook fires
4. Check Vercel logs for URGENT alert
5. Verify dispute link in logs

---

## 📊 Analytics & Metrics

### Key Metrics to Track

**Payment Health:**
- Payment failure rate (invoice.payment_failed / total invoices)
- Recovery rate (users who update payment vs. churn)

**Refund Rate:**
- Total refunds / total revenue
- **Target:** <5% (industry standard)
- **Red flag:** >10% (investigate fraud or UX issues)

**Dispute Rate:**
- Total disputes / total transactions
- **Target:** <0.5% (Stripe requires <1%)
- **Red flag:** >1% (risk of Stripe account suspension)

**MRR Impact:**
- Revenue lost to refunds
- Revenue lost to disputes
- Processing fees lost

---

## ✅ Security Benefits

### Before These Handlers:

❌ Users could keep paid access after payment failed  
❌ Users could get refunds but keep premium features  
❌ Chargebacks went unnoticed until revenue dropped  
❌ No visibility into payment issues  
❌ Manual database fixes required

### After These Handlers:

✅ Automatic downgrade on payment failure (after retries)  
✅ Immediate downgrade on refund  
✅ Instant admin alerts for disputes  
✅ Complete audit trail in logs  
✅ Revenue protection automated  
✅ Chargeback prevention enabled

---

## 🎯 Summary

You now have **enterprise-grade payment protection**:

1. **invoice.payment_failed** - Marks users as past_due, allows Stripe retries
2. **charge.refunded** - Downgrades immediately, alerts admin
3. **charge.dispute.created** - URGENT alert with evidence deadline

**Deploy Checklist:**

- ✅ Code ready for deployment
- ✅ Webhook handlers implemented
- ⏳ Frontend components needed (PaymentFailedBanner)
- ⏳ Subscription status utility updated
- ⏳ Admin monitoring process established

**Your revenue is now protected!** 🛡️
