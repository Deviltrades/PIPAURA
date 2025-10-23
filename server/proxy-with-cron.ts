#!/usr/bin/env node
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { setupCronRoutes } from './cron-routes.js';
import { setupMentorRoutes } from './mentor-routes.js';
import { handleConnect, handleStatus, handleSyncUser, handleDisconnect } from './myfxbook-handlers.js';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 5000;
const VITE_PORT = 5173; // Internal Vite port

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

// Initialize Supabase for webhook handler
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase credentials missing - webhooks will not work');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Helper function to get plan config from Stripe metadata or price
// IMPORTANT: If pricing changes, update these mappings!
// Current pricing (as of October 2025):
//   Lite: £4.99/month (499p) or £49.99/year (4999p)
//   Core: £14/month (1400p) or £114/year (11400p)
//   Elite: £24/month (2400p) or £230/year (23000p)
function getPlanFromStripeData(metadata?: Stripe.Metadata | null, items?: Stripe.ApiList<Stripe.SubscriptionItem>): 'lite' | 'core' | 'elite' | null {
  // First try metadata (from checkout session)
  if (metadata?.planId) {
    return metadata.planId as 'lite' | 'core' | 'elite';
  }
  
  // Then try to infer from price amount (subscription items)
  // This covers billing portal changes and subscription renewals
  if (items && items.data.length > 0) {
    const firstItem = items.data[0];
    const price = firstItem.price;
    
    // Map price amounts to plans (in pence for GBP)
    const amount = price.unit_amount || 0;
    
    if (amount === 499 || amount === 4999) return 'lite';
    if (amount === 1400 || amount === 11400) return 'core';
    if (amount === 2400 || amount === 23000) return 'elite';
  }
  
  return null;
}

// Helper function to update user plan in Supabase (or create if doesn't exist)
async function updateUserPlan(email: string, planId: 'lite' | 'core' | 'elite') {
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    throw new Error('Database connection unavailable');
  }

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
      console.error('❌ Failed to update user plan:', error);
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
      console.error('❌ Failed to create user profile:', error);
      throw error;
    }

    console.log(`✅ Created new user profile for ${email} with ${planId} plan (storage: ${limits.storage_limit_mb}MB, accounts: ${limits.account_limit})`);
    return data[0];
  }
}

// Webhook endpoint needs raw body for signature verification
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  if (!supabase) {
    console.error('❌ Supabase credentials missing - cannot process webhooks');
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  if (!sig) {
    return res.status(400).json({ error: 'No signature provided' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('💳 Checkout completed:', session.id);

        // Extract customer email and plan info
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
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`📋 Subscription ${event.type}:`, subscription.id);
        
        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (!('email' in customer) || !customer.email) {
          console.error('Customer has no email:', subscription.customer);
          return res.status(400).json({ error: 'Customer has no email' });
        }

        // Determine plan from subscription items
        const planId = getPlanFromStripeData(subscription.metadata, subscription.items);
        
        if (!planId) {
          console.error('Could not determine plan from subscription:', subscription.id);
          return res.status(400).json({ error: 'Could not determine plan type' });
        }

        await updateUserPlan(customer.email, planId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('❌ Subscription cancelled:', subscription.id);
        
        // Downgrade user to lite plan
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if ('email' in customer && customer.email) {
          await updateUserPlan(customer.email, 'lite');
          console.log(`📉 Downgraded user ${customer.email} to lite plan`);
        } else {
          console.error('Customer has no email:', subscription.customer);
          return res.status(400).json({ error: 'Customer has no email' });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('❌ Error processing webhook:', err);
    return res.status(500).json({ error: `Webhook processing failed: ${err.message}` });
  }
});

// Parse JSON bodies for cron endpoints and Stripe (except webhook)
app.use(express.json());

// Setup cron API routes first (these take priority)
setupCronRoutes(app);

// Setup mentor API routes
setupMentorRoutes(app);

// Stripe checkout session creation endpoint
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { planId, interval, customerEmail } = req.body;
    
    if (!planId || !interval) {
      return res.status(400).json({ error: "Missing planId or interval" });
    }

    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email is required for subscription" });
    }

    // Define your pricing (in pence for GBP)
    const prices = {
      lite: {
        monthly: 499,    // £4.99
        yearly: 4999,    // £49.99
      },
      core: {
        monthly: 1400,   // £14.00
        yearly: 11400,   // £114.00
      },
      elite: {
        monthly: 2400,   // £24.00
        yearly: 23000,   // £230.00
      },
    };

    const amount = prices[planId as keyof typeof prices]?.[interval as keyof typeof prices.lite];
    
    if (!amount) {
      return res.status(400).json({ error: "Invalid plan or interval" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // Recurring subscription
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `PipAura ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
              description: `${interval.charAt(0).toUpperCase() + interval.slice(1)} subscription`,
            },
            unit_amount: amount,
            recurring: {
              interval: interval === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        planId,
        interval,
        customerEmail,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// MyFxBook API endpoints
app.post("/api/myfxbook/connect", handleConnect);
app.get("/api/myfxbook/status", handleStatus);
app.post("/api/myfxbook/sync-user", handleSyncUser);
app.post("/api/myfxbook/disconnect", handleDisconnect);

// Stripe Customer Portal session creation endpoint
app.post("/api/create-portal-session", async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized - Missing or invalid authorization header" });
    }

    const token = authHeader.split(' ')[1];
    
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection unavailable' });
    }
    
    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: "Unauthorized - Invalid token or user" });
    }

    const customerEmail = user.email;

    // Find or create Stripe customer by email
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });

    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer if doesn't exist
      const customer = await stripe.customers.create({
        email: customerEmail,
      });
      customerId = customer.id;
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin}/user`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe portal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy everything else to Vite dev server
// API routes are already defined above, so they won't be proxied
app.use('/', createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying for HMR
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Proxy server with Cron API running on port ${PORT}`);
  console.log(`📡 Cron endpoints ready on /api/cron/*`);
  console.log(`💳 Stripe checkout endpoint ready on /api/create-checkout-session`);
  console.log(`📊 MyFxBook endpoints ready on /api/myfxbook/*`);
  console.log(`🔄 Proxying all other requests to Vite on port ${VITE_PORT}\n`);
});
