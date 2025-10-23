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

async function createOrUpdateUserPlan(email: string, planId: PlanType) {
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
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        plan_type: planId,
        storage_limit_mb: limits.storage_limit_mb,
        image_limit: limits.image_limit,
        account_limit: limits.account_limit
      })
      .eq('email', email)
      .select();

    if (error) {
      console.error('Failed to update user plan:', error);
      throw error;
    }

    console.log(`✅ Updated existing user ${email} to ${planId} plan`);
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
    if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
      console.log(`ℹ️ Auth user already exists for ${email}, fetching existing user`);
      
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
        console.error(`User ${email} should exist but was not found`);
        throw new Error(`Account verification failed for ${email}`);
      }

      authUserId = existingAuthUser.id;
      console.log(`✅ Found existing Auth user for ${email}, ID: ${authUserId}`);
    } else {
      console.error('Failed to create Supabase Auth user:', authError);
      throw new Error(`Failed to create account for ${email}: ${authError.message}`);
    }
  } else if (authUser.user) {
    authUserId = authUser.user.id;
    console.log(`✅ Created new Supabase Auth user for ${email}, ID: ${authUserId}`);
  } else {
    throw new Error(`Unexpected response when creating user ${email}`);
  }

  // Create or update user profile (upsert for idempotency)
  const { data: newProfile, error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      supabase_user_id: authUserId,
      email,
      plan_type: planId,
      storage_limit_mb: limits.storage_limit_mb,
      image_limit: limits.image_limit,
      account_limit: limits.account_limit,
      storage_used_mb: 0,
      image_count: 0
    }, {
      onConflict: 'supabase_user_id',
      ignoreDuplicates: false
    })
    .select();

  if (profileError) {
    console.error('Failed to create/update user profile:', profileError);
    throw new Error(`Profile setup failed for ${email}: ${profileError.message}`);
  }

  console.log(`✅ Created/updated user profile for ${email} with ${planId} plan (storage: ${limits.storage_limit_mb}MB, accounts: ${limits.account_limit})`);

  // Send password reset email so user can set their password (only if new account)
  if (authUser?.user) {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://pipaura.com/reset-password`
    });

    if (resetError) {
      console.warn(`⚠️ Created account for ${email} but failed to send password setup email:`, resetError);
    } else {
      console.log(`📧 Sent password setup email to ${email}`);
    }
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
        console.log('Checkout completed:', session.id);

        const customerEmail = session.customer_details?.email || session.customer_email;
        const planId = getPlanFromStripeData(session.metadata);
        
        if (!customerEmail) {
          console.error('Missing email in checkout session:', session.id);
          return res.status(400).json({ error: 'Missing customer email' });
        }

        if (!planId) {
          console.error('Missing or invalid planId in session:', session.id);
          return res.status(400).json({ error: 'Missing or invalid plan ID' });
        }

        await createOrUpdateUserPlan(customerEmail, planId);
        console.log(`Checkout completed for ${customerEmail}, plan: ${planId}`);
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

        await createOrUpdateUserPlan(customerEmail, planId);
        console.log(`Subscription ${event.type} for ${customerEmail}, plan: ${planId}`);
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

        await createOrUpdateUserPlan(customerEmail, 'lite');
        console.log(`Downgraded ${customerEmail} to lite plan after cancellation`);
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
