# ForexTrader Pro

## Overview

ForexTrader Pro is a comprehensive trading journal application designed for forex, indices, and cryptocurrency traders. The application provides advanced analytics, trade logging, signal sharing, and performance tracking capabilities. Built as a full-stack web application with a modern React frontend and Express.js backend, it integrates with Replit's authentication system and includes professional-grade file upload capabilities through Google Cloud Storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React 18 and TypeScript, utilizing a component-based architecture with the following key design decisions:

- **UI Framework**: Implements shadcn/ui components built on Radix UI primitives for accessible, customizable interface elements
- **Styling**: Uses Tailwind CSS with a custom design system supporting light/dark themes and responsive design
- **State Management**: React Query (TanStack Query) handles server state management with optimistic updates and caching
- **Routing**: Wouter provides lightweight client-side routing for SPA navigation
- **Form Handling**: React Hook Form with Zod schema validation ensures type-safe form management

### Backend Architecture
The server-side follows a RESTful API design pattern using Express.js:

- **Framework**: Express.js with TypeScript for type-safe server development
- **Database ORM**: Drizzle ORM provides type-safe database operations with PostgreSQL
- **Authentication**: Integrates with Replit's OpenID Connect authentication system
- **Session Management**: PostgreSQL-backed session storage with configurable TTL
- **Error Handling**: Centralized error middleware with proper HTTP status codes

### Data Storage Solutions
The application uses a PostgreSQL database with the following schema design:

- **Users Table**: Stores user profiles with Replit Auth integration (email, names, profile images, admin flags, dashboard widget preferences)
- **Trades Table**: Comprehensive trade logging with instrument types (FOREX/INDICES/CRYPTO), position details, P&L tracking
- **Signals Table**: Signal sharing system with entry/exit prices, risk management parameters
- **Sessions Table**: Secure session storage for authentication persistence

### Dashboard Features
The dashboard includes a fully customizable widget system allowing users to:
- Add/remove widgets from 8 different types (P&L summary, win rate, active trades, charts, etc.)
- Categorize widgets by performance, analytics, and trades
- Persist widget preferences to database
- Interactive hover-to-remove functionality
- Real-time data updates

### Authentication and Authorization
Authentication is handled through Replit's managed authentication service:

- **Provider**: OpenID Connect integration with Replit's authentication system
- **Session Security**: HTTP-only cookies with HTTPS enforcement and configurable expiration
- **Access Control**: Role-based permissions with admin flag support
- **Security**: CSRF protection and secure session management

### External Dependencies

#### Cloud Services
- **Replit Authentication**: Managed OpenID Connect authentication service
- **Google Cloud Storage**: Object storage for file uploads and attachments with ACL-based access control
- **PostgreSQL Database**: Managed database service (likely Neon based on connection configuration)

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