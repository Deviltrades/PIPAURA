#!/usr/bin/env node
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { setupCronRoutes } from './cron-routes.js';
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

// Webhook endpoint needs raw body for signature verification
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  if (!sig) {
    return res.status(400).send('No signature');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('💳 Checkout completed:', session.id);

        // Extract customer email and plan info
        const customerEmail = session.customer_details?.email || session.customer_email;
        const planId = session.metadata?.planId as 'lite' | 'core' | 'elite';
        
        if (!customerEmail || !planId) {
          console.error('Missing email or planId in session:', session.id);
          break;
        }

        // Update user plan in Supabase
        if (supabase) {
          const { data, error } = await supabase
            .from('user_profiles')
            .update({ 
              plan_type: planId,
              storage_limit_mb: planId === 'lite' ? 1024 : planId === 'core' ? 2048 : 10240,
              account_limit: planId === 'lite' ? 1 : planId === 'core' ? 10 : 999999
            })
            .eq('email', customerEmail)
            .select();

          if (error) {
            console.error('❌ Failed to update user plan:', error);
          } else if (data && data.length > 0) {
            console.log(`✅ Updated user ${customerEmail} to ${planId} plan`);
          } else {
            console.warn(`⚠️ No user found with email ${customerEmail}`);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('📋 Subscription event:', subscription.id);
        // Handle subscription updates if needed
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('❌ Subscription cancelled:', subscription.id);
        
        // Optionally downgrade user to lite plan
        if (supabase && subscription.customer) {
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          if ('email' in customer && customer.email) {
            await supabase
              .from('user_profiles')
              .update({ 
                plan_type: 'lite',
                storage_limit_mb: 1024,
                account_limit: 1
              })
              .eq('email', customer.email);
            
            console.log(`📉 Downgraded user ${customer.email} to lite plan`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Error processing webhook:', err);
    res.status(500).send(`Webhook handler error: ${err.message}`);
  }
});

// Parse JSON bodies for cron endpoints and Stripe (except webhook)
app.use(express.json());

// Setup cron API routes first (these take priority)
setupCronRoutes(app);

// Stripe checkout session creation endpoint
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { planId, interval } = req.body;
    
    if (!planId || !interval) {
      return res.status(400).json({ error: "Missing planId or interval" });
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
      success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        planId,
        interval,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy everything else to Vite dev server
app.use(createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying for HMR
  // Don't proxy API routes
  filter: (pathname) => !pathname.startsWith('/api/'),
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Proxy server with Cron API running on port ${PORT}`);
  console.log(`📡 Cron endpoints ready on /api/cron/*`);
  console.log(`💳 Stripe checkout endpoint ready on /api/create-checkout-session`);
  console.log(`🔄 Proxying all other requests to Vite on port ${VITE_PORT}\n`);
});
