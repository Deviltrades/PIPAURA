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

### Backend
The application uses a pure Supabase architecture for all database operations, authentication, and file storage, enabling a JAMstack approach without a separate server.

### Data Storage
Supabase PostgreSQL stores all data, including user profiles, journal entries (instrument types, position details, P&L), and Supabase Storage handles trade attachments.

### Dashboard
Features a customizable widget system with 8 types, drag-and-drop, resize functionality, and template saving for up to 5 custom layouts.

### Account Filtering System
A universal account selector enables database-level filtering by `account_id` across all pages. React Query uses account-specific cache keys for data isolation, ensuring consistent data updates and cross-page consistency.

### Calendar
Offers comprehensive settings persistence for display options (weekends, totals, consistency tracker), view modes, and filter selections. It integrates with the account filtering system for account-specific views.

### Authentication and Authorization
Supabase Auth manages email/password authentication, JWT tokens, session management, role-based permissions, and custom sign-up/sign-in forms with production-ready email verification.

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