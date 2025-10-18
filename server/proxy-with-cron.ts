#!/usr/bin/env node
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { setupCronRoutes } from './cron-routes.js';
import Stripe from 'stripe';

const app = express();
const PORT = 5000;
const VITE_PORT = 5173; // Internal Vite port

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-10-28.acacia",
});

// Parse JSON bodies for cron endpoints and Stripe
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
      institutional: {
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
