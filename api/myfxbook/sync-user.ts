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

// Re-login to MyFxBook if session expired
async function refreshMyFxBookSession(email: string, password: string) {
  const response = await fetch('https://www.myfxbook.com/api/login.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      email,
      password,
    }),
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
  
  // Crypto patterns
  if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('USDT')) {
    return 'CRYPTO';
  }
  
  // Index patterns
  if (sym.includes('US30') || sym.includes('NAS100') || sym.includes('SPX500') || sym.includes('UK100')) {
    return 'INDICES';
  }
  
  // Forex pattern (6 characters, currency pairs)
  if (sym.length === 6 && /^[A-Z]{6}$/.test(sym)) {
    return 'FOREX';
  }
  
  // Default to FOREX
  return 'FOREX';
}

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

    const encryptionPassphrase = process.env.ENC_PASSPHRASE;
    if (!encryptionPassphrase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Step 1: Get linked account
    const { data: linkedAccount, error: linkedError } = await supabase
      .from('myfxbook_linked_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', 1)
      .single();

    if (linkedError || !linkedAccount) {
      return res.status(404).json({ error: 'No MyFxBook account linked' });
    }

    // Step 2: Check if session is expired and refresh if needed
    let sessionId = linkedAccount.session_id;
    const sessionExpiry = new Date(linkedAccount.session_expires_at);

    if (!sessionId || sessionExpiry < new Date()) {
      console.log('Session expired, refreshing...');
      const decryptedPassword = decrypt(linkedAccount.encrypted_password, encryptionPassphrase);
      const { sessionId: newSession, expiresAt } = await refreshMyFxBookSession(
        linkedAccount.email,
        decryptedPassword
      );

      sessionId = newSession;

      // Update session in database
      await supabase
        .from('myfxbook_linked_accounts')
        .update({
          session_id: sessionId,
          session_expires_at: expiresAt.toISOString(),
        })
        .eq('id', linkedAccount.id);
    }

    // Step 3: Get all MyFxBook accounts for this user
    const { data: myfxbookAccounts, error: accountsError } = await supabase
      .from('myfxbook_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', 1)
      .eq('auto_sync_enabled', 1);

    if (accountsError) {
      throw new Error('Failed to fetch MyFxBook accounts');
    }

    if (!myfxbookAccounts || myfxbookAccounts.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No active MyFxBook accounts to sync',
        importedCount: 0
      });
    }

    // Step 4: Sync trades for each account
    let totalImported = 0;

    for (const account of myfxbookAccounts) {
      try {
        const trades = await fetchMyFxBookTrades(
          sessionId,
          account.myfxbook_account_id,
          account.last_trade_id || undefined
        );

        if (trades.length === 0) {
          console.log(`No new trades for account ${account.account_name}`);
          continue;
        }

        // Map and insert trades
        for (const trade of trades) {
          const mappedTrade = mapMyFxBookTrade(
            trade,
            user.id,
            account.pipaura_account_id
          );

          // Insert trade (ignore duplicates based on ticket_id)
          await supabase.from('trades').upsert(mappedTrade, {
            onConflict: 'ticket_id',
            ignoreDuplicates: true,
          });

          totalImported++;
        }

        // Update last trade ID
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
        // Continue with other accounts even if one fails
      }
    }

    // Step 5: Update last sync time
    await supabase
      .from('myfxbook_linked_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'active',
        sync_error_message: null,
      })
      .eq('id', linkedAccount.id);

    console.log(`Successfully synced ${totalImported} trades for user ${user.id}`);

    return res.status(200).json({
      success: true,
      importedCount: totalImported,
      accountsProcessed: myfxbookAccounts.length,
    });
  } catch (error: any) {
    console.error('MyFxBook sync error:', error);

    return res.status(500).json({
      error: error.message || 'Failed to sync MyFxBook trades',
    });
  }
}
