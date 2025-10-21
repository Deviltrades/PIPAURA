import express from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase credentials missing - mentor routes will not work');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Middleware to extract user from auth header
async function getUserFromToken(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export function setupMentorRoutes(app: express.Express) {
  // Search users by username or email
  app.get('/api/mentor/search-users', async (req, res) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const searchQuery = req.query.searchQuery as string || '';
      
      if (searchQuery.length < 2) {
        return res.json([]);
      }

      if (!supabase) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      // Search for users by username or email (case-insensitive)
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, email, username, full_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .neq('id', user.id) // Exclude current user
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return res.status(500).json({ error: 'Search failed' });
      }

      // Check for existing connections
      const userIds = users?.map(u => u.id) || [];
      const { data: connections } = await supabase
        .from('mentor_connections')
        .select('mentee_id, status')
        .eq('mentor_id', user.id)
        .in('mentee_id', userIds);

      const connectionsMap = new Map(
        connections?.map(c => [c.mentee_id, c.status]) || []
      );

      const results = users?.map(u => ({
        ...u,
        already_connected: connectionsMap.get(u.id) === 'accepted',
        pending_invite: connectionsMap.get(u.id) === 'pending',
      })) || [];

      res.json(results);
    } catch (error: any) {
      console.error('Error in search-users:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // Send invitation
  app.post('/api/mentor/invite', express.json(), async (req, res) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { email, username, userId } = req.body;

      if (!email && !username && !userId) {
        return res.status(400).json({ error: 'Email, username, or userId required' });
      }

      if (!supabase) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      // Find the mentee by email, username, or userId
      let menteeQuery = supabase.from('user_profiles').select('id, email, username, full_name');
      
      if (userId) {
        menteeQuery = menteeQuery.eq('id', userId);
      } else if (email) {
        menteeQuery = menteeQuery.eq('email', email);
      } else if (username) {
        menteeQuery = menteeQuery.eq('username', username);
      }

      const { data: menteeData, error: menteeError } = await menteeQuery.single();

      if (menteeError || !menteeData) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if connection already exists
      const { data: existingConnection } = await supabase
        .from('mentor_connections')
        .select('id, status')
        .eq('mentor_id', user.id)
        .eq('mentee_id', menteeData.id)
        .maybeSingle();

      if (existingConnection) {
        if (existingConnection.status === 'accepted') {
          return res.status(400).json({ error: 'Already connected to this trader' });
        } else if (existingConnection.status === 'pending') {
          return res.status(400).json({ error: 'Invitation already pending' });
        }
      }

      // Get mentor's name for notification
      const { data: mentorProfile } = await supabase
        .from('user_profiles')
        .select('full_name, email, username')
        .eq('id', user.id)
        .single();

      // Create connection
      const { data: connection, error: connectionError } = await supabase
        .from('mentor_connections')
        .insert({
          mentor_id: user.id,
          mentee_id: menteeData.id,
          mentee_email: menteeData.email,
          mentee_username: menteeData.username,
          status: 'pending'
        })
        .select()
        .single();

      if (connectionError) {
        console.error('Error creating connection:', connectionError);
        return res.status(500).json({ error: 'Failed to create connection' });
      }

      // Create notification for mentee
      const mentorName = mentorProfile?.full_name || mentorProfile?.username || mentorProfile?.email || 'A mentor';
      await supabase
        .from('notifications')
        .insert({
          user_id: menteeData.id,
          type: 'mentor_invite',
          title: 'New Mentorship Request',
          message: `${mentorName} wants to connect as your mentor and view your trading accounts.`,
          metadata: {
            connection_id: connection.id,
            mentor_name: mentorName,
            mentor_email: mentorProfile?.email
          }
        });

      res.json({ success: true, connection });
    } catch (error: any) {
      console.error('Error in invite:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // Get mentor's traders
  app.get('/api/mentor/traders', async (req, res) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!supabase) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      // Get accepted connections with mentee details
      const { data: connections, error } = await supabase
        .from('mentor_connections')
        .select(`
          id,
          mentee_id,
          created_at,
          user_profiles!mentor_connections_mentee_id_fkey (
            id,
            email,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('mentor_id', user.id)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching traders:', error);
        return res.status(500).json({ error: 'Failed to fetch traders' });
      }

      // TODO: Fetch trader stats (trades, win rate, P&L, etc.)
      // For now, return basic info
      const traders = connections?.map(c => {
        const profile = (c as any).user_profiles;
        return {
          id: c.mentee_id,
          name: profile?.full_name || profile?.username || 'Anonymous',
          email: profile?.email,
          avatar: profile?.avatar_url,
          status: 'active', // TODO: Calculate based on recent activity
          joinDate: c.created_at,
          totalTrades: 0,
          winRate: 0,
          profitLoss: 0,
          profitFactor: 0,
          consistency: 0,
          riskScore: 'N/A',
          lastActive: 'Unknown',
          recentTrades: 0
        };
      }) || [];

      res.json(traders);
    } catch (error: any) {
      console.error('Error in traders:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // Accept connection
  app.post('/api/mentor/connection/:connectionId/accept', async (req, res) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { connectionId } = req.params;

      if (!supabase) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      // Verify the connection belongs to this user (as mentee)
      const { data: connection, error: fetchError } = await supabase
        .from('mentor_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('mentee_id', user.id)
        .single();

      if (fetchError || !connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      if (connection.status !== 'pending') {
        return res.status(400).json({ error: 'Connection already processed' });
      }

      // Update connection status
      const { error: updateError } = await supabase
        .from('mentor_connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (updateError) {
        console.error('Error accepting connection:', updateError);
        return res.status(500).json({ error: 'Failed to accept connection' });
      }

      // Create notification for mentor
      const { data: menteeProfile } = await supabase
        .from('user_profiles')
        .select('full_name, email, username')
        .eq('id', user.id)
        .single();

      const menteeName = menteeProfile?.full_name || menteeProfile?.username || menteeProfile?.email || 'A trader';
      await supabase
        .from('notifications')
        .insert({
          user_id: connection.mentor_id,
          type: 'mentor_accepted',
          title: 'Mentorship Request Accepted',
          message: `${menteeName} accepted your mentorship request! You can now view their trading accounts.`,
          metadata: {
            connection_id: connectionId,
            mentee_name: menteeName
          }
        });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error accepting connection:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // Reject connection
  app.post('/api/mentor/connection/:connectionId/reject', async (req, res) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { connectionId } = req.params;

      if (!supabase) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      // Verify the connection belongs to this user (as mentee)
      const { data: connection, error: fetchError } = await supabase
        .from('mentor_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('mentee_id', user.id)
        .single();

      if (fetchError || !connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      if (connection.status !== 'pending') {
        return res.status(400).json({ error: 'Connection already processed' });
      }

      // Update connection status
      const { error: updateError } = await supabase
        .from('mentor_connections')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (updateError) {
        console.error('Error rejecting connection:', updateError);
        return res.status(500).json({ error: 'Failed to reject connection' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error rejecting connection:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // Get notifications
  app.get('/api/notifications', async (req, res) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!supabase) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
      }

      res.json(notifications || []);
    } catch (error: any) {
      console.error('Error in notifications:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:notificationId/read', async (req, res) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { notificationId } = req.params;

      if (!supabase) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ error: 'Failed to update notification' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating notification:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // Get trader details (read-only)
  app.get('/api/mentor/trader/:traderId/details', async (req, res) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { traderId } = req.params;

      if (!supabase) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      // Verify mentor has access to this trader
      const { data: connection, error: connError } = await supabase
        .from('mentor_connections')
        .select('id')
        .eq('mentor_id', user.id)
        .eq('mentee_id', traderId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (connError || !connection) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get trader profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email, username, full_name, avatar_url')
        .eq('id', traderId)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: 'Trader not found' });
      }

      res.json({
        name: profile.full_name || profile.username || 'Anonymous',
        email: profile.email,
        avatar_url: profile.avatar_url,
      });
    } catch (error: any) {
      console.error('Error fetching trader details:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // Get trader accounts (read-only)
  app.get('/api/mentor/trader/:traderId/accounts', async (req, res) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { traderId } = req.params;

      if (!supabase) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      // Verify mentor has access to this trader
      const { data: connection, error: connError } = await supabase
        .from('mentor_connections')
        .select('id')
        .eq('mentor_id', user.id)
        .eq('mentee_id', traderId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (connError || !connection) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get trader accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', traderId)
        .order('created_at', { ascending: false });

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
        return res.status(500).json({ error: 'Failed to fetch accounts' });
      }

      res.json(accounts || []);
    } catch (error: any) {
      console.error('Error fetching trader accounts:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // Get trader stats (read-only)
  app.get('/api/mentor/trader/:traderId/stats', async (req, res) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { traderId } = req.params;

      if (!supabase) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      // Verify mentor has access to this trader
      const { data: connection, error: connError } = await supabase
        .from('mentor_connections')
        .select('id')
        .eq('mentor_id', user.id)
        .eq('mentee_id', traderId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (connError || !connection) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get trader trades
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', traderId)
        .eq('status', 'CLOSED');

      if (tradesError) {
        console.error('Error fetching trades:', tradesError);
        return res.status(500).json({ error: 'Failed to fetch trades' });
      }

      // Calculate stats
      const totalTrades = trades?.length || 0;
      const winningTrades = trades?.filter(t => (t.pnl || 0) > 0).length || 0;
      const losingTrades = trades?.filter(t => (t.pnl || 0) < 0).length || 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      
      const profitLoss = trades?.reduce((sum, t) => sum + (t.pnl || 0), 0) || 0;
      
      const wins = trades?.filter(t => (t.pnl || 0) > 0) || [];
      const losses = trades?.filter(t => (t.pnl || 0) < 0) || [];
      
      const totalWinAmount = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const totalLossAmount = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
      
      const avgWin = wins.length > 0 ? totalWinAmount / wins.length : 0;
      const avgLoss = losses.length > 0 ? totalLossAmount / losses.length : 0;
      
      const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.pnl || 0)) : 0;
      const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.pnl || 0)) : 0;
      
      const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 999 : 0;

      res.json({
        total_trades: totalTrades,
        win_rate: winRate,
        profit_loss: profitLoss,
        profit_factor: profitFactor,
        avg_win: avgWin,
        avg_loss: avgLoss,
        largest_win: largestWin,
        largest_loss: largestLoss,
      });
    } catch (error: any) {
      console.error('Error calculating trader stats:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  console.log('✅ Mentor routes initialized:');
  console.log('   GET  /api/mentor/search-users');
  console.log('   POST /api/mentor/invite');
  console.log('   GET  /api/mentor/traders');
  console.log('   POST /api/mentor/connection/:id/accept');
  console.log('   POST /api/mentor/connection/:id/reject');
  console.log('   GET  /api/mentor/trader/:id/details');
  console.log('   GET  /api/mentor/trader/:id/accounts');
  console.log('   GET  /api/mentor/trader/:id/stats');
  console.log('   GET  /api/notifications');
  console.log('   PATCH /api/notifications/:id/read\n');
}
