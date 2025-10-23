import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, interval, customerEmail } = req.body;

    if (!planId || !interval) {
      return res.status(400).json({ error: 'Missing required fields: planId and interval' });
    }

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required for subscription' });
    }

    // Validate planId
    const validPlans = ['lite', 'core', 'elite'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Validate interval
    const validIntervals = ['monthly', 'yearly'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({ error: 'Invalid interval' });
    }

    // Define fixed prices (in pence for GBP)
    const prices: Record<string, Record<string, number>> = {
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

    const amount = prices[planId]?.[interval];
    
    if (!amount) {
      return res.status(400).json({ error: 'Invalid plan or interval' });
    }

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://pipaura.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
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
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        planId,
        interval,
        customerEmail,
      },
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
