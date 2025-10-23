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

async function updateUserPlan(email: string, planId: PlanType) {
  const planLimits = {
    lite: { storage_limit_mb: 1024, image_limit: 999999, account_limit: 1 },
    core: { storage_limit_mb: 2048, image_limit: 999999, account_limit: 10 },
    elite: { storage_limit_mb: 10240, image_limit: 999999, account_limit: 999999 }
  };

  const limits = planLimits[planId];

  // First, try to find existing user
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    // User exists, update their plan
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

    console.log(`✅ Updated user ${email} to ${planId} plan (storage: ${limits.storage_limit_mb}MB, accounts: ${limits.account_limit})`);
    return data[0];
  } else {
    // User doesn't exist yet, create profile with purchased plan
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        email,
        plan_type: planId,
        storage_limit_mb: limits.storage_limit_mb,
        image_limit: limits.image_limit,
        account_limit: limits.account_limit,
        storage_used_mb: 0,
        image_count: 0
      })
      .select();

    if (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }

    console.log(`✅ Created new user profile for ${email} with ${planId} plan (storage: ${limits.storage_limit_mb}MB, accounts: ${limits.account_limit})`);
    return data[0];
  }
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

        await updateUserPlan(customerEmail, planId);
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

        await updateUserPlan(customerEmail, planId);
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

        await updateUserPlan(customerEmail, 'lite');
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
