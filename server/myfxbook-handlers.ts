import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials for MyFxBook handlers');
}

// Use Supabase service client for all database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Encryption/Decryption functions
export function encrypt(text: string, passphrase: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(passphrase, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedData: string, passphrase: string): string {
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

// MyFxBook API functions
export async function loginToMyFxBook(email: string, password: string) {
  // MyFxBook API uses GET method with query parameters
  const params = new URLSearchParams({
    email,
    password,
  });
  
  const response = await fetch(`https://www.myfxbook.com/api/login.json?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    console.error('MyFxBook API HTTP error:', response.status, response.statusText);
    throw new Error(`MyFxBook API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('MyFxBook login response:', JSON.stringify(data, null, 2));

  if (!data.session) {
    console.error('MyFxBook response missing session. Full response:', data);
    
    if (data.error) {
      throw new Error(`MyFxBook: ${data.message || data.error}`);
    }
    
    throw new Error('Failed to get session from MyFxBook. Check your credentials.');
  }

  return {
    sessionId: data.session,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

export async function fetchMyFxBookAccounts(sessionId: string) {
  console.log(`Fetching MyFxBook accounts with session: ${sessionId.substring(0, 20)}...`);
  
  const response = await fetch(
    `https://www.myfxbook.com/api/get-my-accounts.json?session=${sessionId}`
  );

  if (!response.ok) {
    console.error('MyFxBook get-my-accounts HTTP error:', response.status, response.statusText);
    throw new Error(`MyFxBook API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('MyFxBook accounts response:', JSON.stringify(data, null, 2));

  if (!data.accounts || !Array.isArray(data.accounts)) {
    console.warn('No accounts array in response or not an array');
    return [];
  }

  console.log(`Found ${data.accounts.length} MyFxBook accounts`);
  return data.accounts;
}

export async function fetchMyFxBookTrades(sessionId: string, accountId: string, lastTradeId?: string) {
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

export function inferInstrumentType(symbol: string): 'FOREX' | 'INDICES' | 'CRYPTO' | 'FUTURES' | 'STOCKS' {
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

export function mapMyFxBookTrade(trade: any, userId: string, pipAuraAccountId?: string) {
  // Use MyFxBook's unique identifiers in order of preference
  // Create deterministic ticket_id from trade data (no Math.random!)
  const ticketId = String(
    trade.historyId ?? 
    trade.ticket ?? 
    trade.id ?? 
    `myfxbook_${trade.symbol}_${trade.openTime}_${trade.closeTime}_${trade.openPrice}_${trade.closePrice}`.replace(/[^a-zA-Z0-9_]/g, '_')
  );
  
  return {
    user_id: userId,
    account_id: pipAuraAccountId || null,
    ticket_id: ticketId,
    instrument: trade.symbol || 'UNKNOWN',
    instrument_type: inferInstrumentType(trade.symbol),
    trade_type: trade.action === 'buy' ? 'BUY' : 'SELL',
    position_size: parseFloat(trade.sizing?.value || trade.lots || trade.volume) || 0,
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

// Route handlers
export async function handleConnect(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' });
    }

    const encryptionPassphrase = process.env.ENC_PASSPHRASE;
    if (!encryptionPassphrase) {
      console.error('ENC_PASSPHRASE not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log(`Connecting MyFxBook account for user ${user.id}`);
    const { sessionId, expiresAt } = await loginToMyFxBook(email, password);

    const encryptedPassword = encrypt(password, encryptionPassphrase);

    // Upsert linked account using Supabase
    const { data: linkedAccount, error: linkedError } = await supabase
      .from('myfxbook_linked_accounts')
      .upsert({
        user_id: user.id,
        email,
        encrypted_password: encryptedPassword,
        session_id: sessionId,
        session_expires_at: expiresAt.toISOString(),
        sync_status: 'connected',
        sync_error_message: null,
        last_sync_at: new Date().toISOString(),
        is_active: 1,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (linkedError || !linkedAccount) {
      throw new Error('Failed to create linked account: ' + linkedError?.message);
    }

    // Get user profile ID (required for trade_accounts)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Fetch MyFxBook accounts
    const accounts = await fetchMyFxBookAccounts(sessionId);

    // Create PipAura trading accounts and save MyFxBook accounts
    for (const account of accounts) {
      // Check if this MyFxBook account already has a PipAura account
      const { data: existingMfxAccount } = await supabase
        .from('myfxbook_accounts')
        .select('pipaura_account_id')
        .eq('myfxbook_account_id', String(account.id))
        .maybeSingle();

      let pipauraAccountId = existingMfxAccount?.pipaura_account_id;

      // Create PipAura trading account if it doesn't exist
      if (!pipauraAccountId) {
        const { data: newPipauraAccount, error: pipauraError } = await supabase
          .from('trade_accounts')
          .insert({
            user_id: profile.id,
            account_name: account.name || `MyFxBook #${account.id}`,
            broker_name: account.broker || 'Unknown Broker',
            account_type: 'live_personal',
            market_type: 'forex',
            starting_balance: parseFloat(account.deposits) || parseFloat(account.balance) || 0,
            current_balance: parseFloat(account.balance) || 0,
            currency: account.currency || 'USD',
          })
          .select('id')
          .single();

        if (pipauraError || !newPipauraAccount) {
          console.error(`Failed to create PipAura account for ${account.name}:`, pipauraError);
          throw new Error(`Failed to create PipAura account: ${pipauraError?.message}`);
        }

        pipauraAccountId = newPipauraAccount.id;
      }

      // Upsert MyFxBook account with PipAura account link
      const { error: accountError } = await supabase
        .from('myfxbook_accounts')
        .upsert({
          linked_account_id: linkedAccount.id,
          user_id: user.id,
          myfxbook_account_id: String(account.id),
          account_name: account.name,
          broker: account.broker || null,
          currency: account.currency || 'USD',
          balance: parseFloat(account.balance) || 0,
          equity: parseFloat(account.equity) || 0,
          gain: parseFloat(account.gain) || 0,
          pipaura_account_id: pipauraAccountId,
          auto_sync_enabled: 1,
          is_active: 1,
        }, {
          onConflict: 'myfxbook_account_id'
        });
      
      if (accountError) {
        console.error(`Failed to save MyFxBook account ${account.name}:`, accountError);
        throw new Error(`Failed to save account ${account.name}: ${accountError.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      linkedAccountId: linkedAccount.id,
      accounts: accounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        broker: acc.broker,
        balance: acc.balance,
        currency: acc.currency,
      })),
    });
  } catch (error: any) {
    console.error('MyFxBook connect error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to connect MyFxBook account' 
    });
  }
}

export async function handleStatus(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Use Supabase client
    const { data: linkedAccount, error: linkedError } = await supabase
      .from('myfxbook_linked_accounts')
      .select('id, email, last_sync_at, sync_status, sync_error_message, is_active')
      .eq('user_id', user.id)
      .eq('is_active', 1)
      .maybeSingle();

    if (linkedError && linkedError.code !== 'PGRST116') {
      throw linkedError;
    }

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

export async function handleDisconnect(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
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

export async function handleSyncUser(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const encryptionPassphrase = process.env.ENC_PASSPHRASE;
    if (!encryptionPassphrase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get linked account using Supabase
    const { data: linkedAccount, error: linkedError } = await supabase
      .from('myfxbook_linked_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', 1)
      .single();

    if (linkedError || !linkedAccount) {
      return res.status(404).json({ error: 'No MyFxBook account linked' });
    }

    let sessionId = linkedAccount.session_id;
    const sessionExpiry = new Date(linkedAccount.session_expires_at);

    // Re-authenticate if session expired
    if (new Date() >= sessionExpiry) {
      const decryptedPassword = decrypt(linkedAccount.encrypted_password, encryptionPassphrase);
      const { sessionId: newSessionId, expiresAt } = await loginToMyFxBook(
        linkedAccount.email,
        decryptedPassword
      );
      sessionId = newSessionId;

      await supabase
        .from('myfxbook_linked_accounts')
        .update({
          session_id: newSessionId,
          session_expires_at: expiresAt.toISOString(),
        })
        .eq('id', linkedAccount.id);
    }

    // Get MyFxBook accounts to sync
    const { data: myfxbookAccounts, error: accountsError } = await supabase
      .from('myfxbook_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', 1)
      .eq('auto_sync_enabled', 1);

    if (accountsError) {
      throw accountsError;
    }

    if (!myfxbookAccounts || myfxbookAccounts.length === 0) {
      return res.status(404).json({ error: 'No MyFxBook accounts to sync' });
    }

    let totalImported = 0;

    // Sync trades for each account
    for (const account of myfxbookAccounts) {
      try {
        const trades = await fetchMyFxBookTrades(sessionId, account.myfxbook_account_id);
        console.log(`Fetched ${trades.length} trades for account ${account.myfxbook_account_id}`);
        
        for (const trade of trades) {
          // Skip deposits and withdrawals - they're not actual trades
          if (trade.action === 'Deposit' || trade.action === 'Withdrawal' || !trade.symbol) {
            continue;
          }
          
          const mappedTrade = mapMyFxBookTrade(
            trade,
            user.id,
            account.pipaura_account_id
          );

          // Check if trade already exists
          const { data: existingTrade } = await supabase
            .from('trades')
            .select('id')
            .eq('user_id', user.id)
            .eq('ticket_id', mappedTrade.ticket_id)
            .single();

          // Only insert if it doesn't exist
          if (!existingTrade) {
            const { error: insertError } = await supabase
              .from('trades')
              .insert(mappedTrade);

            if (!insertError) {
              totalImported++;
            } else {
              console.error(`Error inserting trade ${mappedTrade.ticket_id}:`, insertError);
            }
          }
        }
      } catch (err) {
        console.error(`Error syncing account ${account.myfxbook_account_id}:`, err);
        continue;
      }
    }

    // Update last sync timestamp
    await supabase
      .from('myfxbook_linked_accounts')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'synced',
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
