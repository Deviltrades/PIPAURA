# TJ - Traders Brotherhood

## Overview

TJ - Traders Brotherhood is a comprehensive trading journal application designed for forex, indices, and cryptocurrency traders. The application provides advanced analytics, trade logging, signal sharing, and performance tracking capabilities. Built as a full-stack web application with a modern React frontend and Express.js backend, it now uses complete Supabase integration for authentication, database, and file storage.

## User Preferences

Preferred communication style: Simple, everyday language.
Authentication preference: Supabase Auth with email/password authentication (migrated from custom auth on 2025-09-22).
Settings access: Settings icon next to theme toggle with dedicated logout tab.

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