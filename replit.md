# TJ - Traders Brotherhood

## Overview
TJ - Traders Brotherhood is a comprehensive trading journal application for forex, indices, and cryptocurrency traders. It offers advanced analytics, trade logging, signal sharing, and performance tracking. The application is a full-stack web application with a modern React frontend and a Supabase backend for authentication, database, and file storage. The business vision is to provide traders with a robust tool to improve their performance through detailed analysis and tracking, with ambitions to expand into advanced AI-driven insights and community features.

## User Preferences
Preferred communication style: Simple, everyday language.
Authentication preference: Supabase Auth with email/password authentication.
Settings access: Settings icon next to theme toggle with dedicated logout tab.

## System Architecture

### Frontend Architecture
The client-side application is built with React 18 and TypeScript, using a component-based architecture. It leverages shadcn/ui components built on Radix UI, Tailwind CSS for styling (supporting light/dark themes and responsiveness), React Query for server state management, Wouter for lightweight client-side routing, and React Hook Form with Zod for type-safe form validation.

### Backend Architecture
The application utilizes a pure Supabase architecture, eliminating the need for a separate Express.js server in production. All database operations, authentication, and file storage are handled directly through Supabase. This enables a JAMstack architecture with a serverless backend.

### Data Storage Solutions
The application uses Supabase PostgreSQL for all data storage, including:
- **User Profiles**: Extended user data.
- **Journal Entries**: Main trading journal entries with instrument types, position details, and P&L tracking.
- **File Storage**: Supabase Storage for trade attachments and supporting documents.

### Dashboard Features
The dashboard features a customizable widget system allowing users to add/remove from 8 widget types, categorize them, persist preferences, and enjoy real-time data updates. It includes drag-and-drop and resize functionality for widgets, and a template system to save up to 5 custom dashboard layouts.

### Calendar Features
The trading calendar offers comprehensive settings persistence, including auto-save of display options (weekends, weekly/monthly totals, consistency tracker), view modes (percentage/dollar, clear view), and filter selections (account, symbol, strategy, direction). It also provides quick navigation with month/year selectors.

### Authentication and Authorization
Authentication is handled entirely through Supabase Auth, providing:
- Email/password authentication with verification.
- JWT tokens and automatic session management.
- Role-based permissions support through Supabase Auth users.
- Custom sign-up and sign-in forms.
- Production-ready email verification with domain restrictions.

### Automated Fundamental Bias System
A comprehensive automated fundamental analysis system provides real-time (30-min/hourly) and weekly deep analysis. It uses Python scripts (`hourly_update.py`, `main.py`) to gather data from various sources (Polygon.io, Yahoo Finance, TradingEconomics, EconDB, ForexFactory) to score currencies, FX pairs, and indices. This data is stored in Supabase (`currency_scores`, `fundamental_bias`, `index_bias` tables) and integrated into the frontend for display in a "Fundamental Strength" tab.

### Forex Factory Economic Calendar Integration
An event-driven bias update system processes the Forex Factory economic calendar. A Python script (`forexfactory_feed.py`) fetches and scores events, triggering instant bias recalculations for high-impact events and regular refreshes for others. Scores are integrated into overall bias calculations and stored in `forex_events` and `economic_scores` tables.

### Floating DNA Core Visualization
The analytics page features a "Trader DNA Core" visualization: an animated 3D-like double-helix structure colored by overall Edge Integrity score, with six orbiting metrics (Win Rate, Avg R:R, Risk Consistency, Emotional Control, Discipline, Session Focus) connected by dynamic glowing beams.

### Instrument Type Expansion
The application supports five asset classes (FOREX, INDICES, CRYPTO, FUTURES, STOCKS) with advanced searchable dropdowns and custom instrument creation. Users can create any custom instrument not in predefined lists, with smart detection to prevent duplicates.

### CSV Trade Upload System
A robust CSV import system supports MT4/MT5/TradeZella formats with:
- **Auto-Delimiter Detection**: Automatically detects comma, semicolon, or tab delimiters.
- **Flexible Column Mapping**: Supports multiple column name variations (e.g., "Ticket", "Order", "Deal #", "Trade ID").
- **Broker Compatibility**: Handles capitalized headers from MT4/MT5 exports and various broker formats.
- **Account Association**: Links all imported trades to selected trading account.
- **Balance Updates**: Automatically updates account balance based on closed trades.

#### Trade Enrichment System (Currently Disabled)
An automated post-upload enrichment system is built but temporarily disabled due to Supabase PostgREST schema cache issues (PGRST204 errors). The system calculates:
- **Session Detection**: Identifies trading session (London/New York/Asia) based on UTC entry time.
- **Holding Time**: Calculates duration between entry and exit in minutes.
- **Profit Normalization**: Computes profit-per-lot for position sizing analysis.

Database columns exist (`session_tag`, `holding_time_minutes`, `profit_per_lot`) but PostgREST API doesn't recognize them. Enrichment logic is commented out in `supabase-service.ts` until resolved. Similar issue affects `ticket_id` column for duplicate detection.

**Workaround**: Lines marked "TEMPORARILY EXCLUDED" in CSV upload and trade CRUD functions can be uncommented once schema cache refreshes.

## External Dependencies

### Cloud Services
- **Supabase**: Backend-as-a-service for authentication, PostgreSQL database, and file storage.

### File Upload System
- **Uppy**: Advanced file upload library for dashboard UI, progress tracking, and drag-and-drop.

### UI and Visualization
- **Recharts**: Charting library for performance analytics and trading statistics.
- **Radix UI**: Accessible component primitives for consistent user interface.
- **Lucide Icons**: Consistent iconography throughout the application.

### Development Tools
- **Vite**: Fast development server and build tool.
- **ESBuild**: High-performance bundling for production builds.
- **TypeScript**: Type safety across the application stack.