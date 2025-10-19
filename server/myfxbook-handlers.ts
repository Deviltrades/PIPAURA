import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import pkg from 'pg';
const { Client } = pkg;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials for MyFxBook handlers');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Direct database connection to bypass schema cache
async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  return client;
}

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

    // Use direct SQL to bypass schema cache
    const dbClient = await getDbClient();
    let linkedAccount: any;
    let accounts: any[];
    
    try {
      const result = await dbClient.query(`
        INSERT INTO myfxbook_linked_accounts 
          (user_id, email, encrypted_password, session_id, session_expires_at, sync_status, is_active, last_sync_at)
        VALUES 
          ($1, $2, $3, $4, $5, 'connected', 1, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          email = EXCLUDED.email,
          encrypted_password = EXCLUDED.encrypted_password,
          session_id = EXCLUDED.session_id,
          session_expires_at = EXCLUDED.session_expires_at,
          sync_status = 'connected',
          sync_error_message = NULL,
          last_sync_at = NOW(),
          updated_at = NOW()
        RETURNING *
      `, [user.id, email, encryptedPassword, sessionId, expiresAt.toISOString()]);

      linkedAccount = result.rows[0];
      if (!linkedAccount) {
        throw new Error('Failed to create linked account');
      }

      accounts = await fetchMyFxBookAccounts(sessionId);

      for (const account of accounts) {
        await dbClient.query(`
          INSERT INTO myfxbook_accounts 
            (linked_account_id, user_id, myfxbook_account_id, account_name, broker, currency, balance, equity, gain, pipaura_account_id, auto_sync_enabled, is_active)
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, 1, 1)
          ON CONFLICT (myfxbook_account_id) 
          DO UPDATE SET 
            account_name = EXCLUDED.account_name,
            broker = EXCLUDED.broker,
            balance = EXCLUDED.balance,
            equity = EXCLUDED.equity,
            gain = EXCLUDED.gain,
            updated_at = NOW()
        `, [
          linkedAccount.id,
          user.id,
          String(account.id),
          account.name,
          account.broker || null,
          account.currency || 'USD',
          parseFloat(account.balance) || 0,
          parseFloat(account.equity) || 0,
          parseFloat(account.gain) || 0
        ]);
      }
    } finally {
      await dbClient.end();
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

    // Use direct SQL to bypass schema cache issues
    const dbClient = await getDbClient();
    
    try {
      const linkedResult = await dbClient.query(`
        SELECT id, email, last_sync_at, sync_status, sync_error_message, is_active
        FROM myfxbook_linked_accounts
        WHERE user_id = $1 AND is_active = 1
        LIMIT 1
      `, [user.id]);

      const linkedAccount = linkedResult.rows[0] || null;
      let accountCount = 0;

      if (linkedAccount) {
        const countResult = await dbClient.query(`
          SELECT COUNT(*) as count
          FROM myfxbook_accounts
          WHERE linked_account_id = $1 AND is_active = 1
        `, [linkedAccount.id]);

        accountCount = parseInt(countResult.rows[0]?.count || '0', 10);
      }

      return res.status(200).json({
        linked: !!linkedAccount,
        account: linkedAccount || null,
        accountCount,
      });
    } finally {
      await dbClient.end();
    }
  } catch (error: any) {
    console.error('MyFxBook status error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch MyFxBook status',
    });
  }
}

export async function handleSyncUser(req: any, res: any) {
  const dbClient = await getDbClient();
  
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

    // Use direct SQL to bypass schema cache
    const linkedResult = await dbClient.query(`
      SELECT *
      FROM myfxbook_linked_accounts
      WHERE user_id = $1 AND is_active = 1
      LIMIT 1
    `, [user.id]);

    const linkedAccount = linkedResult.rows[0];

    if (!linkedAccount) {
      return res.status(404).json({ error: 'No MyFxBook account linked' });
    }

    let sessionId = linkedAccount.session_id;
    const sessionExpiry = new Date(linkedAccount.session_expires_at);

    if (new Date() >= sessionExpiry) {
      const decryptedPassword = decrypt(linkedAccount.encrypted_password, encryptionPassphrase);
      const { sessionId: newSessionId, expiresAt } = await loginToMyFxBook(
        linkedAccount.email,
        decryptedPassword
      );
      sessionId = newSessionId;

      await dbClient.query(`
        UPDATE myfxbook_linked_accounts
        SET session_id = $1, session_expires_at = $2, updated_at = NOW()
        WHERE id = $3
      `, [newSessionId, expiresAt.toISOString(), linkedAccount.id]);
    }

    const accountsResult = await dbClient.query(`
      SELECT *
      FROM myfxbook_accounts
      WHERE user_id = $1 AND is_active = 1 AND auto_sync_enabled = 1
    `, [user.id]);

    const myfxbookAccounts = accountsResult.rows;

    if (!myfxbookAccounts || myfxbookAccounts.length === 0) {
      return res.status(404).json({ error: 'No MyFxBook accounts to sync' });
    }

    let totalImported = 0;

    for (const account of myfxbookAccounts) {
      try {
        const trades = await fetchMyFxBookTrades(sessionId, account.myfxbook_account_id);
        console.log(`Fetched ${trades.length} trades for account ${account.myfxbook_account_id}`);

        for (const trade of trades) {
          const mappedTrade = mapMyFxBookTrade(
            trade,
            user.id,
            account.pipaura_account_id
          );

          try {
            // Use direct SQL to bypass Supabase schema cache issues
            await dbClient.query(`
              INSERT INTO trades (
                user_id, account_id, ticket_id, instrument, instrument_type, trade_type,
                position_size, entry_price, exit_price, stop_loss, take_profit,
                pnl, swap, commission, currency, status, entry_date, exit_date,
                upload_source, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
              )
              ON CONFLICT (user_id, ticket_id) DO NOTHING
            `, [
              mappedTrade.user_id,
              mappedTrade.account_id,
              mappedTrade.ticket_id,
              mappedTrade.instrument,
              mappedTrade.instrument_type,
              mappedTrade.trade_type,
              mappedTrade.position_size,
              mappedTrade.entry_price,
              mappedTrade.exit_price,
              mappedTrade.stop_loss,
              mappedTrade.take_profit,
              mappedTrade.pnl,
              mappedTrade.swap,
              mappedTrade.commission,
              mappedTrade.currency,
              mappedTrade.status,
              mappedTrade.entry_date,
              mappedTrade.exit_date,
              mappedTrade.upload_source,
              mappedTrade.created_at,
              mappedTrade.updated_at
            ]);
            totalImported++;
          } catch (insertError: any) {
            // Ignore duplicate key errors (23505), log others
            if (insertError.code !== '23505') {
              console.error(`Error inserting trade ${mappedTrade.ticket_id}:`, insertError.message);
            }
          }
        }
      } catch (err) {
        console.error(`Error syncing account ${account.myfxbook_account_id}:`, err);
        continue;
      }
    }

    // Update last sync timestamp
    await dbClient.query(`
      UPDATE myfxbook_linked_accounts
      SET last_sync_at = NOW(), sync_status = 'synced', sync_error_message = NULL, updated_at = NOW()
      WHERE id = $1
    `, [linkedAccount.id]);

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
  } finally {
    await dbClient.end();
  }
}
