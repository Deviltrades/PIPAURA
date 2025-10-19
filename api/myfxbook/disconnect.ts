import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Deactivate linked account
    const { error: deactivateError } = await supabase
      .from('myfxbook_linked_accounts')
      .update({ is_active: 0, sync_status: 'disconnected' })
      .eq('user_id', user.id);

    if (deactivateError) {
      throw new Error('Failed to disconnect account: ' + deactivateError.message);
    }

    // Deactivate all associated MyFxBook accounts
    await supabase
      .from('myfxbook_accounts')
      .update({ is_active: 0, auto_sync_enabled: 0 })
      .eq('user_id', user.id);

    return res.status(200).json({
      success: true,
      message: 'MyFxBook account disconnected successfully',
    });
  } catch (error: any) {
    console.error('MyFxBook disconnect error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to disconnect MyFxBook account',
    });
  }
}
