# PipAura

## Overview
PipAura is a comprehensive trading journal application for forex, indices, and cryptocurrency traders. It provides advanced analytics, trade logging, signal sharing, and performance tracking. The application aims to enhance trader performance through detailed analysis and tracking, with future ambitions for AI-driven insights and community features.

## User Preferences
Preferred communication style: Simple, everyday language.
Authentication preference: Supabase Auth with email/password authentication.
Settings access: Settings icon next to theme toggle with dedicated logout tab.

## System Architecture

### CRITICAL: Environment Separation
- **Replit**: Development environment ONLY (local testing with Neon database).
- **Supabase**: Production backend database (all schemas, tables, RLS policies).
- **Vercel**: Production frontend and serverless API deployment.
- All production schema changes MUST be made directly in Supabase.
- Frontend always connects to Supabase.

### Frontend
The client-side is a React 18 and TypeScript application using `shadcn/ui` (built on Radix UI), Tailwind CSS for styling, React Query for server state management, Wouter for routing, and React Hook Form with Zod for form validation.

### Backend & Deployment
- **Development (Replit)**: Express server handles all API routes, Stripe operations, and cron endpoints. Vite dev server runs on port 5173, proxied through Express on port 5000. Uses Neon database for local testing.
- **Production (Vercel + Supabase)**: Frontend deployed as static Vite build to Vercel. Backend API routes implemented as Vercel serverless functions in `/api` directory for Stripe and cron jobs. Database operations, authentication, and file storage handled by Supabase.

### Data Storage
Supabase PostgreSQL stores all production data, including user profiles, journal entries, and Supabase Storage handles trade attachments.

### Dashboard
Features a customizable widget system with 18+ widget types, drag-and-drop, resize functionality, and template saving. Layouts are saved per breakpoint (lg, md, sm, xs, xxs).

**Analytics Widgets (Added October 2025):**
- **Streak Tracker**: Visual win/loss streak boxes with current streak counter
- **Hold Time Analysis**: Average hold time with session breakdown
- **Most Profitable Instrument**: Top-performing trading pair
- **Monthly Progress Bar**: Target achievement visualization
- **First vs Last Trade**: Pie charts comparing daily opening vs closing trades
- **Setup Breakdown**: Top 5 setups by P&L with win rates
- **Risk Deviation Histogram**: Advanced risk consistency visualization with histogram chart, target risk line (1%), deviation bands (±0.25%), color-coded bars (cyan = within band, red = outside), alert system (triggers when >20% trades outside band), and statistical summary (avg risk %, std dev %, % out of band)
- **Asset Exposure**: Trading volume distribution across asset classes

**Widget Layout System:**
- Merge function ensures new widgets adopt default sizes even when users have saved layouts
- Prevents new widgets from rendering at tiny fallback sizes (w=2, h=2)
- Persists merged layouts automatically to user profile

### Account Filtering System
A universal account selector enables database-level filtering by `account_id` across all pages. React Query uses account-specific cache keys.

### Calendar
Offers comprehensive settings persistence for display options, view modes, and filter selections, integrating with the account filtering system.

### Authentication and Authorization
Supabase Auth manages email/password authentication, JWT tokens, session management, role-based permissions, and custom sign-up/sign-in forms with email verification and password reset.

### Fundamentals Page
Provides comprehensive fundamental analysis across four tabs: Economic Calendar, Market News (from Finnhub API), Market Analysis (real-time fundamental bias), and Fundamental Strength (FX pair bias and currency strength).

### Automated Fundamental Bias System
A comprehensive automated fundamental analysis system provides real-time bias calculations via JavaScript ES6+ serverless functions on Vercel. It leverages RapidAPI for economic events, Yahoo Finance for market data, and manual central bank tone settings. Cron jobs update Supabase tables every 15 minutes, 30 minutes, and 4 hours.

### Market News Integration
Utilizes Finnhub API for real-time market news across forex, general market, and crypto. News articles are automatically classified by impact and stored in the `market_news` Supabase table. A cron job fetches the latest 50 articles every 30 minutes, with deduplication and auto-cleaning.

### Floating DNA Core Visualization
The analytics page features an animated 3D-like double-helix structure colored by overall Edge Integrity score, with six orbiting metrics.

### UI/UX Design and Visual Effects
The application uses a unified cyan/teal color scheme (hsl(188, 94%, 60%)) with dark blue backgrounds. Interactive elements feature glow effects. Light mode is fully supported.

### Instrument Type Expansion
Supports five asset classes (FOREX, INDICES, CRYPTO, FUTURES, STOCKS) with searchable dropdowns and custom instrument creation.

### Multi-Format Trade Upload System
A comprehensive trade import system supports CSV, Excel (.xls/.xlsx), and HTML formats from MT4/MT5/TradeZella. It features automatic file type detection, smart header/row filtering, auto-delimiter detection, flexible column mapping, and broker compatibility.

### Trade Enrichment System
An automated post-upload system calculates and stores advanced trade analytics: session detection, holding time, profit normalization, and duplicate prevention.

### MyFxBook Auto-Sync Integration
A comprehensive automated trade import system that syncs trades directly from MyFxBook accounts:
- Encrypted Credentials: User MyFxBook credentials stored with AES-256 encryption.
- Automatic Syncing: Vercel Cron jobs run every 3 hours.
- Manual Sync: Users can trigger immediate sync.
- Multi-Account Support: Supports multiple MyFxBook trading accounts per user.
- Duplicate Prevention: Unique constraint on `trades.ticket_id` and application-level checks.
- Intelligent Mapping: Automatically maps MyFxBook trade data to PipAura format with instrument type inference.

### Prop Firm Tracker
A comprehensive proprietary firm challenge tracker enables users to monitor their prop firm account progress with real-time metrics:
- Challenge Types: Supports Instant funding, 1-step, 2-step, and 3-step challenges.
- Risk Metrics: Daily max loss, overall max loss, and profit target tracking with visual indicators.
- Funding Progress Tracker: Phase visualization (Challenge/Verification/Funded/Scaling) with clickable transitions.
- Automatic Sync: Metrics automatically update when trades are added or imported.

### Mentor-Mentee System
A comprehensive mentor-mentee invitation system enables experienced traders to guide and monitor their students:
- Invitation System: Mentors can invite traders via email or username.
- Read-Only Access: Accepted mentors gain read-only access to view mentee accounts, trades, and performance stats.
- Security: Access control enforced via `mentor_connections` table.

### Subscription and Payment System
A comprehensive Stripe-based subscription system with three pricing tiers (Lite £4.99/month, Core £14/month, Elite £24/month). 

**Payment-First Flow:**
- Users can purchase without creating an account first
- Stripe checkout collects email during payment
- Webhook automatically creates Supabase Auth account using Admin API
- User profile created with purchased plan tier and limits
- Password reset email sent for account activation
- User sets password and logs in to access journal

**Automatic Fulfillment:**
- Stripe webhooks create/update user accounts and plan tiers
- Idempotent webhook design handles Stripe retries and duplicate events
- Uses upsert pattern to prevent orphaned Auth accounts
- Storage limits and account limits assigned based on plan tier

**Subscription Management:**
- Users manage subscriptions via Stripe Customer Portal
- Plan upgrades/downgrades handled by subscription webhook events
- Grace period cancellations: users retain access until current_period_end
- Professional lock screen shown after grace period expires

**Revenue Protection (Security Webhooks):**
- `invoice.payment_failed`: Marks subscription as past_due, allows Stripe retry attempts
- `charge.refunded`: Immediately downgrades to Lite, logs admin alert
- `charge.dispute.created`: URGENT admin notification with evidence deadline and dispute link
- Automated downgrade logic prevents users from keeping paid access after refunds/chargebacks

## External Dependencies

### Cloud Services
- **Supabase**: Backend-as-a-service for authentication, PostgreSQL database, and file storage.

### File Upload System
- **Uppy**: File upload library for UI, progress tracking, and drag-and-drop.
- **SheetJS (xlsx)**: Excel file parsing library for .xls and .xlsx formats.

### UI and Visualization
- **Recharts**: Charting library for analytics.
- **Radix UI**: Accessible component primitives.
- **Lucide Icons**: Iconography.

### Development Tools
- **Vite**: Fast development server and build tool.
- **ESBuild**: High-performance bundling.
- **TypeScript**: Type safety.