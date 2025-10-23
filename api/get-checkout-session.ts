import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'Missing session_id parameter' });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Return only the necessary information
    return res.status(200).json({
      customer_email: session.customer_details?.email || session.customer_email,
      customer_name: session.customer_details?.name,
      payment_status: session.payment_status,
      status: session.status,
    });
  } catch (error: any) {
    console.error('Failed to retrieve checkout session:', error);
    return res.status(500).json({ error: 'Failed to retrieve session details' });
  }
}
