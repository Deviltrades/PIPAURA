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

function getPlanFromPrice(priceAmount: number): { plan_type: string; storage_limit_mb: number; account_limit: number } {
  if (priceAmount === 499 || priceAmount === 4999) {
    return { plan_type: 'lite', storage_limit_mb: 1024, account_limit: 1 };
  } else if (priceAmount === 1400 || priceAmount === 11400) {
    return { plan_type: 'core', storage_limit_mb: 2048, account_limit: 10 };
  } else if (priceAmount === 2400 || priceAmount === 23000) {
    return { plan_type: 'elite', storage_limit_mb: 10240, account_limit: 999999 };
  }
  return { plan_type: 'lite', storage_limit_mb: 1024, account_limit: 1 };
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
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log('Received Stripe webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_email || session.customer_details?.email;

        if (!customerEmail) {
          console.error('No customer email found in checkout session');
          return res.status(400).json({ error: 'No customer email found' });
        }

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceAmount = subscription.items.data[0].price.unit_amount || 0;

        const { plan_type, storage_limit_mb, account_limit } = getPlanFromPrice(priceAmount);

        const { error: updateError } = await supabase
          .from('users')
          .update({
            plan_type,
            storage_limit_mb,
            account_limit,
            image_limit: 999999,
          })
          .eq('email', customerEmail);

        if (updateError) {
          console.error('Error updating user plan:', updateError);
          return res.status(500).json({ error: 'Failed to update user plan' });
        }

        console.log(`Updated user ${customerEmail} to ${plan_type} plan`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
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

        const priceAmount = subscription.items.data[0].price.unit_amount || 0;
        const { plan_type, storage_limit_mb, account_limit } = getPlanFromPrice(priceAmount);

        const { error: updateError } = await supabase
          .from('users')
          .update({
            plan_type,
            storage_limit_mb,
            account_limit,
            image_limit: 999999,
          })
          .eq('email', customerEmail);

        if (updateError) {
          console.error('Error updating user plan:', updateError);
          return res.status(500).json({ error: 'Failed to update user plan' });
        }

        console.log(`Updated user ${customerEmail} to ${plan_type} plan via subscription ${event.type}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
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

        const { error: updateError } = await supabase
          .from('users')
          .update({
            plan_type: 'lite',
            storage_limit_mb: 1024,
            account_limit: 1,
            image_limit: 999999,
          })
          .eq('email', customerEmail);

        if (updateError) {
          console.error('Error downgrading user to lite:', updateError);
          return res.status(500).json({ error: 'Failed to downgrade user' });
        }

        console.log(`Downgraded user ${customerEmail} to lite plan after cancellation`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
