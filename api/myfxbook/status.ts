import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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

    // Get linked account for authenticated user - return only non-sensitive fields
    const { data: linkedAccount, error: linkedError } = await supabase
      .from('myfxbook_linked_accounts')
      .select('id, email, last_sync_at, sync_status, sync_error_message, is_active')
      .eq('user_id', user.id)
      .eq('is_active', 1)
      .maybeSingle();

    if (linkedError && linkedError.code !== 'PGRST116') {
      throw linkedError;
    }

    // Get account count if linked
    let accountCount = 0;
    if (linkedAccount) {
      const { count, error: countError } = await supabase
        .from('myfxbook_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('linked_account_id', linkedAccount.id)
        .eq('is_active', 1);

      if (!countError) {
        accountCount = count || 0;
      }
    }

    return res.status(200).json({
      linked: !!linkedAccount,
      account: linkedAccount || null,
      accountCount,
    });
  } catch (error: any) {
    console.error('MyFxBook status error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch MyFxBook status',
    });
  }
}
