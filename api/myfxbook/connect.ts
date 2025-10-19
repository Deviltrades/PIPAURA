import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Encryption functions using AES-256
function encrypt(text: string, passphrase: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(passphrase, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

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

// MyFxBook API login function
async function loginToMyFxBook(email: string, password: string) {
  try {
    // MyFxBook API endpoint for login - uses GET with query parameters
    // Documentation: https://www.myfxbook.com/api
    const params = new URLSearchParams({
      email,
      password,
    });
    
    const response = await fetch(`https://www.myfxbook.com/api/login.json?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`MyFxBook API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.session) {
      throw new Error('Failed to get session from MyFxBook');
    }

    return {
      sessionId: data.session,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  } catch (error) {
    console.error('MyFxBook login error:', error);
    throw error;
  }
}

// Fetch MyFxBook accounts for a user
async function fetchMyFxBookAccounts(sessionId: string) {
  try {
    const response = await fetch(
      `https://www.myfxbook.com/api/get-my-accounts.json?session=${sessionId}`
    );

    if (!response.ok) {
      throw new Error(`MyFxBook API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.accounts || !Array.isArray(data.accounts)) {
      return [];
    }

    return data.accounts;
  } catch (error) {
    console.error('MyFxBook fetch accounts error:', error);
    throw error;
  }
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

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' });
    }

    const encryptionPassphrase = process.env.ENC_PASSPHRASE;
    if (!encryptionPassphrase) {
      console.error('ENC_PASSPHRASE not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Step 1: Login to MyFxBook and get session
    console.log(`Connecting MyFxBook account for user ${user.id}`);
    const { sessionId, expiresAt } = await loginToMyFxBook(email, password);

    // Step 2: Encrypt password
    const encryptedPassword = encrypt(password, encryptionPassphrase);

    // Step 3: Store encrypted credentials in database
    const { data: linkedAccount, error: linkedError } = await supabase
      .from('myfxbook_linked_accounts')
      .upsert(
        {
          user_id: user.id,
          email,
          encrypted_password: encryptedPassword,
          session_id: sessionId,
          session_expires_at: expiresAt.toISOString(),
          sync_status: 'active',
          sync_error_message: null,
          is_active: 1,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (linkedError) {
      console.error('Failed to save MyFxBook credentials:', linkedError);
      return res.status(500).json({ error: 'Failed to save credentials' });
    }

    // Step 4: Fetch MyFxBook accounts
    const accounts = await fetchMyFxBookAccounts(sessionId);

    // Step 5: Store MyFxBook accounts in database
    for (const account of accounts) {
      const { error: accountError } = await supabase.from('myfxbook_accounts').upsert(
        {
          linked_account_id: linkedAccount.id,
          user_id: user.id,
          myfxbook_account_id: String(account.id),
          account_name: account.name,
          broker: account.broker || null,
          currency: account.currency || 'USD',
          balance: account.balance || 0,
          equity: account.equity || 0,
          gain: account.gain || 0,
          is_active: 1,
          auto_sync_enabled: 1,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'myfxbook_account_id',
        }
      );
      
      if (accountError) {
        console.error(`Failed to save MyFxBook account ${account.name}:`, accountError);
        return res.status(500).json({ 
          error: `Failed to save account ${account.name}: ${accountError.message}` 
        });
      }
    }

    console.log(`Successfully connected MyFxBook account with ${accounts.length} trading accounts`);

    return res.status(200).json({
      success: true,
      accountCount: accounts.length,
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
