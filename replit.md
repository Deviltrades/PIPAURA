# TJ - Traders Brotherhood

## Overview

TJ - Traders Brotherhood is a comprehensive trading journal application designed for forex, indices, and cryptocurrency traders. The application provides advanced analytics, trade logging, signal sharing, and performance tracking capabilities. Built as a full-stack web application with a modern React frontend and Express.js backend, it now uses complete Supabase integration for authentication, database, and file storage.

## User Preferences

Preferred communication style: Simple, everyday language.
Authentication preference: Supabase Auth with email/password authentication (migrated from custom auth on 2025-09-22).
Settings access: Settings icon next to theme toggle with dedicated logout tab.

## Recent Changes

### Automated Fundamental Bias System - Real-Time & Weekly (Updated 2025-10-10)
Implemented comprehensive automated fundamental analysis system with dual-frequency updates: real-time (30-min/hourly) + weekly deep analysis:

**Real-Time Bias Engine (NEW - 30-min/Hourly):**
- ✅ Python script (`hourly_update.py`) for real-time market-driven bias updates
- ✅ **Cron Schedule 1**: Every 30 min during trading hours (6-22 UTC, Mon-Fri) via `*/30 6-22 * * 1-5`
- ✅ **Cron Schedule 2**: Hourly off-session safety net (24/7) via `0 * * * *`
- ✅ Hybrid Polygon.io → Yahoo Finance fallback for 100% data reliability
- ✅ Updates: 10 currencies, 38 FX pairs, 10 indices every cycle
- ✅ One-line completion log: `[UTC timestamp] ✅ Updated: 10 currencies, 38 pairs, 10 indices`

**Weekly Deep Analysis (Existing):**
- ✅ Python script (`main.py`) automates comprehensive weekly fundamental analysis
- ✅ **38 FX Pairs**: All majors (EUR/USD, GBP/USD, etc.) + all crosses (EUR/GBP, GBP/JPY, etc.) + metals (XAU/USD, XAG/USD)
- ✅ **10 Global Indices**: US500, US100, US30, UK100, GER40, FRA40, EU50, JP225, HK50, AUS200
- ✅ **10 Currencies scored**: USD, EUR, GBP, JPY, CAD, AUD, NZD, CHF, XAU, XAG
- ✅ **Hybrid multi-source data integration** with intelligent fallback:
  - Polygon.io (institutional-grade, tries first): Forex, indices, commodities
  - Yahoo Finance (free fallback, always active): DXY, WTI, GOLD, COPPER, SPX, UST10Y, VIX
  - TradingEconomics API (optional): Economic calendar events
  - EconDB API (optional): CPI, GDP, Interest Rate indicators
  - ForexFactory RSS (optional): Real-time event surprises
  - **Provider chain**: Polygon → Yahoo (guarantees all 7 metrics populated)
- ✅ Scoring model: Economic data surprises, Central Bank tone, Commodity correlations, Market flows, Risk sentiment, Macro indicators
- ✅ Automated weekly execution via Replit Scheduled Jobs (Sunday 00:00 UTC)
- ✅ Stores results in Supabase: `currency_scores`, `fundamental_bias`, and `index_bias` tables

**Frontend Integration:**
- ✅ "Fundamental Strength" tab in Fundamentals page displays all real-time data
- ✅ FX Pair Fundamental Bias: 38 pairs with color-coded badges (green ≥7, red ≤-7, gray neutral), trend icons, summary, confidence
- ✅ Currency Strength Scores: 10 currencies with breakdown by data score, CB tone, market flows with visual progress bars
- ✅ Global Indices Fundamental Bias: 10 indices with color-coded badges (green ≥3, red ≤-3, gray neutral), summaries, scores
- ✅ React Query integration for live data updates
- ✅ Loading and empty states with helpful messages

**Technical Implementation:**
- ✅ Direct Supabase integration using service role key for automation
- ✅ RLS policies: Public read access, service role write access for all tables
- ✅ Service functions: getFundamentalBias(), getCurrencyScores(), getIndexBias()
- ✅ Modular architecture: `main.py` orchestrates, `fetch_fundamentals_free.py` handles EconDB/ForexFactory integration
- ✅ Graceful degradation: System works with any combination of data sources
- ✅ Comprehensive setup documentation in `FUNDAMENTAL_BIAS_SETUP.md`

### Floating DNA Core Visualization (Added 2025-10-07)
Implemented a stunning 3D-like "Trader DNA Core" intelligence visualization on the analytics page:
- **Animated double-helix structure**: Color-coded from red to green based on overall Edge Integrity score
- **Six orbiting metrics**: Win Rate, Avg R:R, Risk Consistency, Emotional Control, Discipline, Session Focus
- **Dynamic glowing beams**: Connect each metric to helix rungs with opacity scaled by metric value
- **Real-time updates**: Auto-refreshes every 5 seconds with latest trade data
- **Neon glow theme**: Dark background with cyan/teal Pipaura aesthetic using Framer Motion animations

### Express.js to Supabase Migration (Completed 2025-10-07)
Successfully completed comprehensive migration from Express.js server to pure Supabase architecture for cleaner frontend-only deployment:

**Migration Complete:**
- ✅ Created `supabase-service.ts` with all database operations (createTrade, getTrades, getAnalytics, uploadFile, createJournalEntry, getTags, etc.)
- ✅ All components migrated to use Supabase directly:
  - AddTradeModal, EditTradeModal: Direct Supabase trade operations
  - Trades page: Supabase getTrades, updateTrade, deleteTrade
  - TradingAnalytics: Direct Supabase analytics queries
  - Journal entries: Supabase journal operations with tags
  - Image uploads: Direct Supabase Storage integration
  - User profiles: Supabase user profile management
- ✅ Build configuration verified working - creates frontend assets in dist/public/ ready for Vercel deployment
- ✅ Zero Express API dependencies - 100% frontend-only architecture

**Architecture Benefits Achieved:**
- ✅ Eliminated Express server on production deployment
- ✅ Simplified Vercel deployment (frontend-only build with vercel.json)
- ✅ Direct Supabase integration reduces complexity and latency
- ✅ Full JAMstack architecture with serverless backend
- ✅ Row Level Security (RLS) policies ensure data isolation per user

## System Architecture

### Frontend Architecture
The client-side application is built with React 18 and TypeScript, utilizing a component-based architecture with the following key design decisions:

- **UI Framework**: Implements shadcn/ui components built on Radix UI primitives for accessible, customizable interface elements
- **Styling**: Uses Tailwind CSS with a custom design system supporting light/dark themes and responsive design
- **State Management**: React Query (TanStack Query) handles server state management with optimistic updates and caching
- **Routing**: Wouter provides lightweight client-side routing for SPA navigation
- **Form Handling**: React Hook Form with Zod schema validation ensures type-safe form management

### Backend Architecture
The server-side follows a RESTful API design pattern using Express.js with complete Supabase integration:

- **Framework**: Express.js with TypeScript for type-safe server development
- **Database**: Supabase PostgreSQL with direct client integration
- **Authentication**: Supabase Auth with JWT token validation and email verification
- **Session Management**: Supabase Auth handles session management automatically
- **Error Handling**: Centralized error middleware with proper HTTP status codes

### Data Storage Solutions
The application uses Supabase PostgreSQL with the following planned schema:

- **User Profiles**: Extended user data stored in Supabase (complementing Supabase Auth users)
- **Journal Entries**: Main trading journal entries with instrument types, position details, P&L tracking
- **File Storage**: Supabase Storage for trade attachments and supporting documents

### Dashboard Features
The dashboard includes a fully customizable widget system allowing users to:
- Add/remove widgets from 8 different types (P&L summary, win rate, active trades, charts, etc.)
- Categorize widgets by performance, analytics, and trades
- Persist widget preferences to database
- Interactive hover-to-remove functionality
- Real-time data updates
- **Drag and drop functionality**: Users can move widgets by dragging anywhere on the widget
- **Resize functionality**: Users can resize widgets by dragging the triangular corner handle
- Clear visual indicators for both drag and resize operations in move mode
- **Template System**: Save and switch between up to 5 custom dashboard layouts with persistent storage (2025-01-31)

### Calendar Features
The trading calendar includes comprehensive settings persistence:
- **Auto-save functionality**: Calendar settings automatically save to database (1-second debounce)
- **User-specific preferences**: Each user's settings persist across sessions
- **Saved settings include**:
  - Display options: Weekends, Weekly Totals, Monthly Stats, Consistency Tracker
  - View modes: Percentage/Dollar display, Clear View toggle
  - Filter selections: Account, Symbol, Strategy, Direction
  - Monthly stats configuration: Risk/Reward, Total P&L, Days Traded, etc.
- **Optionals dropdown**: Clean UI with checkboxes for toggling display options
- **Month/Year selectors**: Quick navigation with dropdown selectors (2020-2030 range)

### Authentication and Authorization
Authentication is now handled through Supabase Auth (migrated 2025-09-22):

- **Provider**: Supabase Auth with email/password authentication and email verification
- **Session Security**: JWT tokens with automatic session management through Supabase
- **Access Control**: Supabase Auth users with role-based permissions support
- **Security**: Supabase handles password hashing, rate limiting, and security best practices
- **Auth Pages**: Custom sign-up and sign-in forms using Supabase Auth hooks
- **Logout Flow**: Settings icon → Logout tab → Redirect to login page after successful logout
- **Email Verification**: Production-ready email verification flow with domain restrictions

### External Dependencies

#### Cloud Services
- **Supabase**: Complete backend-as-a-service for authentication, database, and file storage
- **PostgreSQL Database**: Supabase-managed PostgreSQL with real-time capabilities
- **File Storage**: Supabase Storage for secure file uploads and management

#### File Upload System
- **Uppy**: Advanced file upload library with dashboard UI, progress tracking, and drag-and-drop support
- **Direct Upload**: Client-to-GCS uploads using presigned URLs to minimize server load
- **Access Control**: Custom ACL system for fine-grained file access permissions

#### UI and Visualization
- **Recharts**: Chart library for performance analytics, equity curves, and trading statistics
- **Radix UI**: Accessible component primitives for consistent user interface
- **Lucide Icons**: Consistent iconography throughout the application

#### Development Tools
- **Vite**: Fast development server and build tool with HMR support
- **ESBuild**: High-performance bundling for production builds
- **TypeScript**: Type safety across the entire application stack