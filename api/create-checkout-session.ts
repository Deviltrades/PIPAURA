import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const PRICE_IDS = {
  lite_monthly: process.env.STRIPE_PRICE_LITE_MONTHLY || 'price_lite_monthly',
  lite_yearly: process.env.STRIPE_PRICE_LITE_YEARLY || 'price_lite_yearly',
  core_monthly: process.env.STRIPE_PRICE_CORE_MONTHLY || 'price_core_monthly',
  core_yearly: process.env.STRIPE_PRICE_CORE_YEARLY || 'price_core_yearly',
  elite_monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY || 'price_elite_monthly',
  elite_yearly: process.env.STRIPE_PRICE_ELITE_YEARLY || 'price_elite_yearly',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userEmail, interval } = req.body;

    if (!priceId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields: priceId and userEmail' });
    }

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://pipaura.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userEmail,
        interval,
      },
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
