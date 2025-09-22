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

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: "Unauthorized" });
  }
};