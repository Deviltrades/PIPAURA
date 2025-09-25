import { Express } from "express";
import { supabase } from "./supabase";
import { UserProfile } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends UserProfile {}
  }
}

export function sanitizeUser(user: UserProfile) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    profile_image_url: user.profile_image_url,
    dashboard_widgets: user.dashboard_widgets,
    dashboard_layout: user.dashboard_layout,
    dashboard_templates: user.dashboard_templates,
    calendar_settings: user.calendar_settings,
    sidebar_settings: user.sidebar_settings
  };
}

export function setupAuth(app: Express) {
  // Register endpoint - uses Supabase Auth
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName || null,
            last_name: lastName || null,
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        return res.status(400).json({ message: error.message });
      }

      if (!data.user) {
        return res.status(400).json({ message: "Registration failed" });
      }

      // Create user profile in our database
      const userProfile = {
        id: data.user.id,
        email: data.user.email!,
        first_name: firstName || null,
        last_name: lastName || null,
        profile_image_url: null,
        dashboard_widgets: [],
        dashboard_layout: {},
        dashboard_templates: {},
        calendar_settings: {
          backgroundColor: "#1a1a1a",
          borderColor: "#374151",
          dayBackgroundColor: "#2d2d2d",
          dayBorderColor: "#4b5563"
        },
        sidebar_settings: {
          primaryColor: "blue",
          gradientFrom: "from-blue-950",
          gradientVia: "via-blue-900",
          gradientTo: "to-slate-950",
          headerFrom: "from-blue-600",
          headerTo: "to-blue-500",
          activeGradient: "from-blue-600/20 to-blue-500/20",
          activeBorder: "border-blue-500/30",
          hoverColor: "hover:bg-blue-900/30"
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store user profile in Supabase database
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(userProfile);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue even if profile creation fails - user is still created in auth
      }

      res.status(201).json({ 
        id: data.user.id, 
        email: data.user.email, 
        first_name: firstName, 
        last_name: lastName 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint - uses Supabase Auth
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!data.user) {
        return res.status(401).json({ message: "Login failed" });
      }

      res.json({ 
        id: data.user.id, 
        email: data.user.email,
        access_token: data.session?.access_token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint - uses Supabase Auth
  app.post("/api/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        await supabase.auth.signOut();
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current user endpoint
  app.get("/api/user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "No authorization header" });
      }

      const token = authHeader.replace('Bearer ', '');
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      res.json({ 
        id: user.id, 
        email: user.email,
        first_name: user.user_metadata?.first_name,
        last_name: user.user_metadata?.last_name
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(401).json({ message: "Unauthorized" });
    }
  });
}

// Middleware to check authentication using Supabase token
export const isAuthenticated = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No authorization header" });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Sync user profile with role-based access control
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Check for existing user in both tables
      const existingUsers = await sql`
        SELECT id, email, first_name, last_name FROM users WHERE email = ${user.email}
      `;
      
      const existingProfiles = await sql`
        SELECT id, email, first_name, last_name, plan_type, storage_used_mb, storage_limit_mb, 
               image_count, image_limit, account_limit FROM user_profiles WHERE email = ${user.email}
      `;

      let localUserId;
      
      if (existingUsers.length > 0) {
        // Update existing user in users table
        localUserId = existingUsers[0].id;
        await sql`
          UPDATE users 
          SET first_name = ${user.user_metadata?.first_name || existingUsers[0].first_name},
              last_name = ${user.user_metadata?.last_name || existingUsers[0].last_name},
              updated_at = NOW()
          WHERE email = ${user.email}
        `;
      } else {
        // Create new user in users table with Supabase Auth ID
        localUserId = user.id;
        await sql`
          INSERT INTO users (id, email, first_name, last_name, created_at, updated_at)
          VALUES (${user.id}, ${user.email}, ${user.user_metadata?.first_name || null}, 
                  ${user.user_metadata?.last_name || null}, NOW(), NOW())
        `;
      }

      // Sync or create user profile with role-based access control
      if (existingProfiles.length > 0) {
        // Update existing profile
        await sql`
          UPDATE user_profiles 
          SET id = ${localUserId},
              first_name = ${user.user_metadata?.first_name || existingProfiles[0].first_name},
              last_name = ${user.user_metadata?.last_name || existingProfiles[0].last_name},
              updated_at = NOW()
          WHERE email = ${user.email}
        `;
      } else {
        // Create new profile with default demo plan
        await sql`
          INSERT INTO user_profiles (
            id, email, first_name, last_name, 
            plan_type, storage_used_mb, storage_limit_mb, 
            image_count, image_limit, account_limit,
            created_at, updated_at
          )
          VALUES (
            ${localUserId}, ${user.email}, 
            ${user.user_metadata?.first_name || null}, 
            ${user.user_metadata?.last_name || null},
            'demo', 0.00, 0.00, 0, 0, 0,
            NOW(), NOW()
          )
        `;
      }

      // Use local user ID for requests (preserves existing trades)
      req.userId = localUserId;
    } catch (dbError) {
      console.error('Database error syncing user profile:', dbError);
      return res.status(500).json({ message: "Failed to sync user profile" });
    }

    // Attach user to request object
    req.user = user;
    // req.userId already set above with local user ID
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: "Unauthorized" });
  }
};