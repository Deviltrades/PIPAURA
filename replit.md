# PipAura

## Overview
PipAura is a comprehensive trading journal application for forex, indices, and cryptocurrency traders. It provides advanced analytics, trade logging, signal sharing, and performance tracking. The application aims to enhance trader performance through detailed analysis and tracking, with future ambitions for AI-driven insights and community features.

## User Preferences
Preferred communication style: Simple, everyday language.
Authentication preference: Supabase Auth with email/password authentication.
Settings access: Settings icon next to theme toggle with dedicated logout tab.

## System Architecture

### Frontend
The client-side is a React 18 and TypeScript application using `shadcn/ui` (built on Radix UI), Tailwind CSS for styling (light/dark themes, responsiveness), React Query for server state management, Wouter for routing, and React Hook Form with Zod for form validation.

### Backend & Deployment
**Development (Replit)**: Express server (`server/proxy-with-cron.ts`) handles all API routes, Stripe operations, and cron endpoints. Vite dev server runs on port 5173, proxied through Express on port 5000.

**Production (Vercel + Supabase)**: 
- Frontend deployed as static Vite build to Vercel
- Backend API routes implemented as Vercel serverless functions in `/api` directory:
  - `/api/create-checkout-session.ts` - Stripe checkout session creation
  - `/api/create-portal-session.ts` - Stripe Customer Portal access (auth-protected)
  - `/api/webhooks/stripe.ts` - Stripe webhook handler for subscription events
  - `/api/cron/*` - Scheduled serverless functions for fundamental analysis updates
- Database operations, authentication, and file storage handled by Supabase
- Enables true JAMstack architecture with serverless backend

### Data Storage
Supabase PostgreSQL stores all data, including user profiles, journal entries (instrument types, position details, P&L), and Supabase Storage handles trade attachments.

### Dashboard
Features a customizable widget system with 8 types, drag-and-drop, resize functionality, and template saving for up to 5 custom layouts.

### Account Filtering System
A universal account selector enables database-level filtering by `account_id` across all pages. React Query uses account-specific cache keys for data isolation, ensuring consistent data updates and cross-page consistency.

### Calendar
Offers comprehensive settings persistence for display options (weekends, totals, consistency tracker), view modes, and filter selections. It integrates with the account filtering system for account-specific views.

### Authentication and Authorization
Supabase Auth manages email/password authentication, JWT tokens, session management, role-based permissions, and custom sign-up/sign-in forms with production-ready email verification. Password reset functionality is implemented with a dedicated `/reset-password` route that handles Supabase recovery tokens, allowing users to reset their passwords via email link.

### Fundamentals Page
Provides comprehensive fundamental analysis across four tabs:
- **Economic Calendar**: Weekly events, central bank rates, and external links.
- **Market News**: Real-time news from Finnhub API with smart impact classification (high/medium/low) and auto-refresh.
- **Market Analysis**: Real-time fundamental bias for FX pairs and indices.
- **Fundamental Strength**: Detailed FX pair bias breakdown and currency strength analysis.

### Automated Fundamental Bias System
A comprehensive automated fundamental analysis system provides real-time bias calculations via JavaScript ES6+ serverless functions deployed on Vercel. It leverages RapidAPI for economic events, Yahoo Finance for market data, and manual central bank tone settings. Cron jobs run every 15 minutes (high-impact events), 30 minutes (hourly bias update), and 4 hours (full calendar refresh) to update Supabase tables (`forex_events`, `economic_scores`, `currency_scores`, `fundamental_bias`, `index_bias`).

### Market News Integration
Utilizes Finnhub API for real-time market news across forex, general market, and crypto. News articles are automatically classified by impact (high/medium/low based on keywords) and stored in the `market_news` Supabase table with RLS policies for public read access. A dedicated cron job (every 30 min) fetches the latest 50 articles, deduplicates via unique constraint on (headline, datetime), and auto-cleans news older than 7 days. The frontend displays the latest 15 articles with 60-second auto-refresh and direct article links.

### Floating DNA Core Visualization
The analytics page features a "Trader DNA Core" visualization: an animated 3D-like double-helix structure colored by overall Edge Integrity score, with six orbiting metrics.

### UI/UX Design and Visual Effects
The application uses a unified cyan/teal color scheme (hsl(188, 94%, 60%)) with dark blue backgrounds. Interactive elements feature steady glow effects, except for strong/weak bias cards which pulsate. Light mode is fully supported with theme-aware styling. The custom text-based logo dynamically displays "PipAura" and "Traders Hub." Calendar styling distinguishes non-trading, winning, and losing days.

### Instrument Type Expansion
Supports five asset classes (FOREX, INDICES, CRYPTO, FUTURES, STOCKS) with searchable dropdowns and custom instrument creation, including duplicate detection.

### Multi-Format Trade Upload System
A comprehensive trade import system supports CSV, Excel (.xls/.xlsx), and HTML formats from MT4/MT5/TradeZella. It features automatic file type detection, smart header/row filtering, auto-delimiter detection, flexible column mapping, and broker compatibility. Trades are associated with selected accounts, and balances are updated.

### Trade Enrichment System
An automated post-upload system calculates and stores advanced trade analytics: session detection (London/New York/Asia), holding time, profit normalization (profit-per-lot), and duplicate prevention via `ticket_id`.

### Prop Firm Tracker
A comprehensive proprietary firm challenge tracker enables users to monitor their prop firm account progress with real-time metrics:
- **Challenge Types**: Instant funding, 1-step, 2-step, and 3-step challenges
- **Risk Metrics**: Daily max loss, overall max loss, and profit target tracking with visual progress indicators
- **Real-time Calculations**: Automatic calculation of current daily loss, overall loss, and profit based on account trades
- **Alert System**: Visual warnings when approaching loss limits or achieving profit targets
- **Account Integration**: Seamlessly integrates with prop firm account types for accurate balance tracking
- **Funding Progress Tracker**: Phase visualization (Challenge/Verification/Funded/Scaling) with clickable transitions, drawdown buffer calculations, and pass probability metrics
- **Automatic Sync**: When trades are added via manual entry, OCR upload, or CSV/Excel import, metrics automatically update if the account has an active prop firm tracker. Manual "Sync Metrics" button available for refreshing calculations.

Database schema includes `prop_firm_tracker` table with challenge configuration, loss limits, profit targets, active status tracking, and funding phase tracking. The system queries the `trades` table by `account_id` to calculate metrics, ensuring all trades for prop firm accounts automatically sync to the tracker.

### Subscription and Payment System
A comprehensive Stripe-based subscription system with three pricing tiers:
- **Lite Plan** (£4.99/month, £49.99/year): Entry-level tier with 1 account limit and 1GB monthly storage
- **Core Plan** (£14/month, £114/year): Mid-tier with 10 account limit and 2GB monthly storage
- **Elite Plan** (£24/month, £230/year): Premium tier with unlimited accounts and 10GB monthly storage

**Automatic Fulfillment**: Stripe webhooks automatically update user plan types and storage limits upon successful payment. The webhook endpoint (`/api/webhooks/stripe`) handles:
- `checkout.session.completed`: Updates user to purchased plan (lite/core/elite)
- `customer.subscription.deleted`: Downgrades cancelled subscriptions back to lite plan
- Automatic storage limit updates based on plan tier

**Storage Enforcement**: The `useUserProfile` hook enforces storage limits client-side via the `canPerformAction` function, which checks `storage_used_mb` against `storage_limit_mb` before allowing upload operations.

**Billing Management**: Users can manage their subscriptions through the Stripe Customer Portal accessible from the `/user` page. The portal allows plan upgrades/downgrades, payment method updates, invoice viewing, and subscription cancellation (downgrades to Lite plan).

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