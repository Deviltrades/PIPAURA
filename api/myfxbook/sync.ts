import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Decryption function
function decrypt(encryptedData: string, passphrase: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(passphrase, 'salt', 32);
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Re-login to MyFxBook
async function refreshMyFxBookSession(email: string, password: string) {
  const params = new URLSearchParams({
    email,
    password,
  });
  
  const response = await fetch(`https://www.myfxbook.com/api/login.json?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`MyFxBook login failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.session) {
    throw new Error('Failed to get session from MyFxBook');
  }

  return {
    sessionId: data.session,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

// Fetch trades from MyFxBook
async function fetchMyFxBookTrades(sessionId: string, accountId: string, lastTradeId?: string) {
  const url = lastTradeId
    ? `https://www.myfxbook.com/api/get-history.json?session=${sessionId}&id=${accountId}&startId=${lastTradeId}`
    : `https://www.myfxbook.com/api/get-history.json?session=${sessionId}&id=${accountId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MyFxBook API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.history || !Array.isArray(data.history)) {
    return [];
  }

  return data.history;
}

// Map MyFxBook trade to PipAura format
function mapMyFxBookTrade(trade: any, userId: string, pipAuraAccountId?: string) {
  return {
    user_id: userId,
    account_id: pipAuraAccountId || null,
    ticket_id: String(trade.id),
    instrument: trade.symbol || 'UNKNOWN',
    instrument_type: inferInstrumentType(trade.symbol),
    trade_type: trade.action === 'buy' ? 'BUY' : 'SELL',
    position_size: parseFloat(trade.sizing) || 0,
    entry_price: parseFloat(trade.openPrice) || 0,
    exit_price: parseFloat(trade.closePrice) || null,
    stop_loss: parseFloat(trade.sl) || null,
    take_profit: parseFloat(trade.tp) || null,
    pnl: parseFloat(trade.profit) || 0,
    swap: parseFloat(trade.swap) || 0,
    commission: parseFloat(trade.commission) || 0,
    currency: trade.currency || 'USD',
    status: trade.closeTime ? 'CLOSED' : 'OPEN',
    entry_date: trade.openTime ? new Date(trade.openTime).toISOString() : null,
    exit_date: trade.closeTime ? new Date(trade.closeTime).toISOString() : null,
    upload_source: 'myfxbook',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function inferInstrumentType(symbol: string): 'FOREX' | 'INDICES' | 'CRYPTO' | 'FUTURES' | 'STOCKS' {
  const sym = symbol.toUpperCase();
  
  if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('USDT')) {
    return 'CRYPTO';
  }
  
  if (sym.includes('US30') || sym.includes('NAS100') || sym.includes('SPX500') || sym.includes('UK100')) {
    return 'INDICES';
  }
  
  if (sym.length === 6 && /^[A-Z]{6}$/.test(sym)) {
    return 'FOREX';
  }
  
  return 'FOREX';
}

// Sync trades for a single user
async function syncUserTrades(linkedAccount: any, encryptionPassphrase: string) {
  const userId = linkedAccount.user_id;

  // Check if session is expired and refresh if needed
  let sessionId = linkedAccount.session_id;
  const sessionExpiry = new Date(linkedAccount.session_expires_at);

  if (!sessionId || sessionExpiry < new Date()) {
    console.log(`Refreshing session for user ${userId}`);
    const decryptedPassword = decrypt(linkedAccount.encrypted_password, encryptionPassphrase);
    const { sessionId: newSession, expiresAt } = await refreshMyFxBookSession(
      linkedAccount.email,
      decryptedPassword
    );

    sessionId = newSession;

    await supabase
      .from('myfxbook_linked_accounts')
      .update({
        session_id: sessionId,
        session_expires_at: expiresAt.toISOString(),
      })
      .eq('id', linkedAccount.id);
  }

  // Get all MyFxBook accounts for this user
  const { data: myfxbookAccounts } = await supabase
    .from('myfxbook_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', 1)
    .eq('auto_sync_enabled', 1);

  if (!myfxbookAccounts || myfxbookAccounts.length === 0) {
    return { userId, imported: 0, accounts: 0 };
  }

  let totalImported = 0;

  for (const account of myfxbookAccounts) {
    try {
      const trades = await fetchMyFxBookTrades(
        sessionId,
        account.myfxbook_account_id,
        account.last_trade_id || undefined
      );

      if (trades.length === 0) {
        continue;
      }

      for (const trade of trades) {
        const mappedTrade = mapMyFxBookTrade(trade, userId, account.pipaura_account_id);

        await supabase.from('trades').upsert(mappedTrade, {
          onConflict: 'ticket_id',
          ignoreDuplicates: true,
        });

        totalImported++;
      }

      if (trades.length > 0) {
        const lastTrade = trades[trades.length - 1];
        await supabase
          .from('myfxbook_accounts')
          .update({
            last_trade_id: String(lastTrade.id),
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id);
      }
    } catch (accountError: any) {
      console.error(`Error syncing account ${account.account_name}:`, accountError);
    }
  }

  await supabase
    .from('myfxbook_linked_accounts')
    .update({
      last_sync_at: new Date().toISOString(),
      sync_status: 'active',
      sync_error_message: null,
    })
    .eq('id', linkedAccount.id);

  return { userId, imported: totalImported, accounts: myfxbookAccounts.length };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    console.error('Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const encryptionPassphrase = process.env.ENC_PASSPHRASE;
    if (!encryptionPassphrase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('Starting MyFxBook global sync...');

    // Get all active linked accounts
    const { data: linkedAccounts, error: linkedError } = await supabase
      .from('myfxbook_linked_accounts')
      .select('*')
      .eq('is_active', 1)
      .eq('sync_status', 'active');

    if (linkedError) {
      throw new Error('Failed to fetch linked accounts');
    }

    if (!linkedAccounts || linkedAccounts.length === 0) {
      console.log('No active MyFxBook linked accounts to sync');
      return res.status(200).json({
        success: true,
        message: 'No accounts to sync',
        totalImported: 0,
        usersSynced: 0,
      });
    }

    console.log(`Found ${linkedAccounts.length} linked accounts to sync`);

    // Sync each user
    const results: Array<{ userId: string; imported: number; accounts: number; error?: string }> = [];
    let totalImported = 0;

    for (const linkedAccount of linkedAccounts) {
      try {
        const result = await syncUserTrades(linkedAccount, encryptionPassphrase);
        results.push(result);
        totalImported += result.imported;
        console.log(`User ${result.userId}: Imported ${result.imported} trades from ${result.accounts} accounts`);
      } catch (userError: any) {
        console.error(`Error syncing user ${linkedAccount.user_id}:`, userError);
        
        // Update sync status to error for this user
        await supabase
          .from('myfxbook_linked_accounts')
          .update({
            sync_status: 'error',
            sync_error_message: userError.message || 'Sync failed',
          })
          .eq('id', linkedAccount.id);

        results.push({
          userId: linkedAccount.user_id,
          imported: 0,
          accounts: 0,
          error: userError.message,
        });
      }
    }

    console.log(`MyFxBook sync complete: ${totalImported} total trades imported for ${linkedAccounts.length} users`);

    return res.status(200).json({
      success: true,
      totalImported,
      usersSynced: linkedAccounts.length,
      results,
    });
  } catch (error: any) {
    console.error('MyFxBook global sync error:', error);
    return res.status(500).json({
      error: error.message || 'Global sync failed',
    });
  }
}
