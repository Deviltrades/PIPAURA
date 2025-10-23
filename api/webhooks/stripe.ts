import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

type PlanType = 'lite' | 'core' | 'elite';

function getPlanFromStripeData(metadata?: Stripe.Metadata | null, items?: Stripe.ApiList<Stripe.SubscriptionItem>): PlanType | null {
  // First try metadata (from checkout session)
  if (metadata?.planId) {
    const planId = metadata.planId as string;
    if (planId === 'lite' || planId === 'core' || planId === 'elite') {
      return planId;
    }
  }
  
  // Then try to infer from price amount (subscription items)
  if (items && items.data.length > 0) {
    const amount = items.data[0].price.unit_amount || 0;
    
    if (amount === 499 || amount === 4999) return 'lite';
    if (amount === 1400 || amount === 11400) return 'core';
    if (amount === 2400 || amount === 23000) return 'elite';
  }
  
  return null;
}

async function createOrUpdateUserPlan(
  email: string, 
  planId: PlanType, 
  subscriptionData?: {
    status: 'active' | 'canceled' | 'trialing' | 'past_due';
    current_period_end?: number;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
  }
) {
  const planLimits = {
    lite: { storage_limit_mb: 1024, image_limit: 999999, account_limit: 1 },
    core: { storage_limit_mb: 2048, image_limit: 999999, account_limit: 10 },
    elite: { storage_limit_mb: 10240, image_limit: 999999, account_limit: 999999 }
  };

  const limits = planLimits[planId];

  // Check if user profile already exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id, supabase_user_id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    // User exists, just update their plan
    const updateData: any = { 
      plan_type: planId,
      storage_limit_mb: limits.storage_limit_mb,
      image_limit: limits.image_limit,
      account_limit: limits.account_limit
    };

    // Add subscription tracking fields if provided
    if (subscriptionData) {
      updateData.subscription_status = subscriptionData.status;
      if (subscriptionData.current_period_end) {
        updateData.current_period_end = new Date(subscriptionData.current_period_end * 1000).toISOString();
      }
      if (subscriptionData.stripe_customer_id) {
        updateData.stripe_customer_id = subscriptionData.stripe_customer_id;
      }
      if (subscriptionData.stripe_subscription_id) {
        updateData.stripe_subscription_id = subscriptionData.stripe_subscription_id;
      }
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('email', email)
      .select();

    if (error) {
      console.error('Failed to update user plan:', error);
      throw error;
    }

    console.log(`✅ Updated existing user ${email} to ${planId} plan, status: ${subscriptionData?.status || 'active'}`);
    return data[0];
  }

  // User doesn't exist - create Supabase Auth account
  console.log(`📝 Creating new account for ${email} with ${planId} plan`);

  // Try to create Auth user with Admin API
  let authUserId: string;
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      plan_type: planId,
      created_via: 'stripe_payment'
    }
  });

  if (authError) {
    // If user already exists (Stripe retry or duplicate webhook), fetch them
    // Check for various "user exists" error messages
    const userExistsErrors = [
      'already registered',
      'already exists', 
      'Database error creating new user',
      'User already registered',
      'duplicate key value'
    ];
    
    const isUserExistsError = userExistsErrors.some(msg => 
      authError.message?.toLowerCase().includes(msg.toLowerCase())
    );

    if (isUserExistsError) {
      console.log(`ℹ️ Auth user already exists for ${email}, fetching existing user`);
      console.log(`   Original error: ${authError.message}`);
      
      // List users by email to get existing user
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });

      if (listError) {
        console.error('Failed to list existing users:', listError);
        throw new Error(`Could not verify existing account for ${email}`);
      }

      const existingAuthUser = existingUsers?.users?.find(u => u.email === email);
      if (!existingAuthUser) {
        console.error(`User ${email} should exist but was not found in list`);
        console.error(`This might be a genuine database error, not a duplicate user`);
        throw new Error(`Account verification failed for ${email}: ${authError.message}`);
      }

      authUserId = existingAuthUser.id;
      console.log(`✅ Found existing Auth user for ${email}, ID: ${authUserId}`);
    } else {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ Failed to create Supabase Auth user');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`Email: ${email}`);
      console.error(`Error Name: ${authError.name}`);
      console.error(`Error Message: ${authError.message}`);
      console.error(`Error Status: ${(authError as any).status}`);
      console.error(`Full Error: ${JSON.stringify(authError, null, 2)}`);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      throw new Error(`Failed to create account for ${email}: ${authError.message}`);
    }
  } else if (authUser.user) {
    authUserId = authUser.user.id;
    console.log(`✅ Created new Supabase Auth user for ${email}, ID: ${authUserId}`);
  } else {
    throw new Error(`Unexpected response when creating user ${email}`);
  }

  // Create or update user profile (upsert for idempotency)
  const profileData: any = {
    supabase_user_id: authUserId,
    email,
    plan_type: planId,
    storage_limit_mb: limits.storage_limit_mb,
    image_limit: limits.image_limit,
    account_limit: limits.account_limit,
    storage_used_mb: 0,
    image_count: 0
  };

  // Add subscription tracking fields if provided
  if (subscriptionData) {
    profileData.subscription_status = subscriptionData.status;
    if (subscriptionData.current_period_end) {
      profileData.current_period_end = new Date(subscriptionData.current_period_end * 1000).toISOString();
    }
    if (subscriptionData.stripe_customer_id) {
      profileData.stripe_customer_id = subscriptionData.stripe_customer_id;
    }
    if (subscriptionData.stripe_subscription_id) {
      profileData.stripe_subscription_id = subscriptionData.stripe_subscription_id;
    }
  }

  const { data: newProfile, error: profileError } = await supabase
    .from('user_profiles')
    .upsert(profileData, {
      onConflict: 'supabase_user_id',
      ignoreDuplicates: false
    })
    .select();

  if (profileError) {
    console.error('Failed to create/update user profile:', profileError);
    throw new Error(`Profile setup failed for ${email}: ${profileError.message}`);
  }

  console.log(`✅ Created/updated user profile for ${email} with ${planId} plan (storage: ${limits.storage_limit_mb}MB, accounts: ${limits.account_limit})`);

  // ALWAYS send password reset email (for new accounts and re-subscribers)
  // This ensures users can set/reset their password regardless of account status
  console.log(`\n📧 Attempting to send password setup email to ${email}...`);
  
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `https://pipaura.com/reset-password`
  });

  if (resetError) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ CRITICAL: PASSWORD EMAIL FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`Email: ${email}`);
    console.error(`Error Name: ${resetError.name}`);
    console.error(`Error Message: ${resetError.message}`);
    console.error(`Error Status: ${(resetError as any).status}`);
    console.error(`Full Error: ${JSON.stringify(resetError, null, 2)}`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('NEXT STEPS:');
    console.error('1. Check Supabase Auth → Email Templates (Reset Password enabled)');
    console.error('2. Check Supabase Auth → SMTP Settings (custom provider configured)');
    console.error('3. Check Supabase Auth → URL Configuration (pipaura.com/reset-password whitelisted)');
    console.error('4. Test manual password reset from Supabase dashboard');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // Don't throw - account is created, just log the error for monitoring
  } else {
    console.log('✅ Password setup email sent successfully!');
    console.log(`   To: ${email}`);
    console.log(`   Redirect: https://pipaura.com/reset-password`);
    console.log(`   Check inbox (and spam folder) within 1-2 minutes`);
  }

  return newProfile[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error('Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    console.log('Received Stripe webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💳 CHECKOUT COMPLETED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Session ID: ${session.id}`);
        console.log(`Stripe Event ID: ${event.id}`);

        const customerEmail = session.customer_details?.email || session.customer_email;
        const planId = getPlanFromStripeData(session.metadata);
        
        if (!customerEmail) {
          console.error('❌ Missing email in checkout session:', session.id);
          return res.status(400).json({ error: 'Missing customer email' });
        }

        if (!planId) {
          console.error('❌ Missing or invalid planId in session:', session.id);
          return res.status(400).json({ error: 'Missing or invalid plan ID' });
        }

        console.log(`Customer Email: ${customerEmail}`);
        console.log(`Plan: ${planId}`);
        console.log('Creating user account and sending password setup email...');

        await createOrUpdateUserPlan(customerEmail, planId);
        
        console.log(`✅ Checkout processing complete for ${customerEmail}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${event.type}:`, subscription.id);

        const customerId = subscription.customer as string;
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

        const planId = getPlanFromStripeData(null, subscription.items);
        
        if (!planId) {
          console.error('Could not determine plan from subscription:', subscription.id);
          return res.status(400).json({ error: 'Could not determine plan' });
        }

        // Map Stripe subscription status to our status enum
        const statusMap: Record<string, 'active' | 'canceled' | 'trialing' | 'past_due'> = {
          'active': 'active',
          'trialing': 'trialing',
          'past_due': 'past_due',
          'canceled': 'canceled',
          'incomplete': 'active', // Treat as active if they complete payment
          'incomplete_expired': 'expired' as any,
          'unpaid': 'past_due'
        };

        await createOrUpdateUserPlan(customerEmail, planId, {
          status: statusMap[subscription.status] || 'active',
          current_period_end: (subscription as any).current_period_end,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id
        });

        console.log(`Subscription ${event.type} for ${customerEmail}, plan: ${planId}, status: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription cancelled:', subscription.id);

        const customerId = subscription.customer as string;
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

        // Get current user profile to preserve their plan_type
        const { data: currentProfile } = await supabase
          .from('user_profiles')
          .select('plan_type')
          .eq('email', customerEmail)
          .single();

        const currentPlan = currentProfile?.plan_type || 'lite';

        // Mark as canceled but KEEP their current plan_type and period_end
        // They'll retain access until current_period_end expires
        await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'canceled',
            // Keep plan_type as-is for analytics
            // Keep current_period_end so we know when access expires
            updated_at: new Date().toISOString()
          })
          .eq('email', customerEmail);

        console.log(`✅ Marked ${customerEmail} subscription as canceled (keeping ${currentPlan} plan until period ends)`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('❌ Payment failed for invoice:', invoice.id);

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

        // Mark subscription as past_due
        await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('email', customerEmail);

        console.log(`⚠️ PAYMENT FAILED: ${customerEmail} - marked as past_due (Attempt ${invoice.attempt_count || 1})`);
        console.log(`   Invoice: ${invoice.id}, Amount: ${invoice.amount_due / 100} ${invoice.currency.toUpperCase()}`);
        
        // After multiple failed attempts, Stripe will cancel the subscription automatically
        // which will trigger customer.subscription.deleted webhook
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💸 Refund issued for charge:', charge.id);

        const customerId = charge.customer as string;
        if (!customerId) {
          console.error('No customer ID in refunded charge');
          return res.status(400).json({ error: 'No customer ID' });
        }

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

        // Get current profile for context
        const { data: currentProfile } = await supabase
          .from('user_profiles')
          .select('plan_type, subscription_status')
          .eq('email', customerEmail)
          .single();

        const previousPlan = currentProfile?.plan_type || 'unknown';
        const refundAmount = charge.amount_refunded / 100;
        const currency = charge.currency.toUpperCase();

        // Downgrade to Lite immediately (they got their money back)
        await createOrUpdateUserPlan(customerEmail, 'lite', {
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: undefined
        });

        // Log for admin review
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚨 REFUND ALERT - ADMIN ACTION MAY BE REQUIRED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email: ${customerEmail}`);
        console.log(`Previous Plan: ${previousPlan}`);
        console.log(`Refund Amount: ${refundAmount} ${currency}`);
        console.log(`Charge ID: ${charge.id}`);
        console.log(`Customer ID: ${customerId}`);
        console.log(`Reason: ${charge.refunds?.data[0]?.reason || 'Not specified'}`);
        console.log(`Action Taken: Downgraded to Lite plan`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        console.log('⚡ Dispute created:', dispute.id);

        const chargeId = dispute.charge as string;
        const charge = await stripe.charges.retrieve(chargeId);
        
        const customerId = charge.customer as string;
        if (!customerId) {
          console.error('No customer ID in disputed charge');
          return res.status(400).json({ error: 'No customer ID' });
        }

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

        // Get user profile for context
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('plan_type, subscription_status, created_at')
          .eq('email', customerEmail)
          .single();

        const disputeAmount = dispute.amount / 100;
        const currency = dispute.currency.toUpperCase();

        // URGENT: Log dispute for immediate admin attention
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚨🚨🚨 URGENT: PAYMENT DISPUTE CREATED 🚨🚨🚨');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`⚠️  IMMEDIATE ADMIN ATTENTION REQUIRED ⚠️`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email: ${customerEmail}`);
        console.log(`Plan: ${userProfile?.plan_type || 'unknown'}`);
        console.log(`Status: ${userProfile?.subscription_status || 'unknown'}`);
        console.log(`Dispute Amount: ${disputeAmount} ${currency}`);
        console.log(`Dispute Reason: ${dispute.reason}`);
        console.log(`Dispute ID: ${dispute.id}`);
        console.log(`Charge ID: ${chargeId}`);
        console.log(`Customer ID: ${customerId}`);
        console.log(`Customer Since: ${userProfile?.created_at || 'unknown'}`);
        console.log(`Dispute Status: ${dispute.status}`);
        console.log(`Evidence Due: ${dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000).toISOString() : 'N/A'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Action: Review in Stripe Dashboard immediately`);
        console.log(`Link: https://dashboard.stripe.com/disputes/${dispute.id}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');

        // Note: Don't immediately downgrade on dispute creation
        // Wait for dispute resolution (dispute.closed webhook)
        // Stripe will handle the chargeback automatically if you lose
        
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
