# Vercel Deployment Guide

## Overview
This project is configured for frontend deployment to Vercel while using Supabase as the complete backend (database, authentication, and storage).

## Configuration Files
- `vercel.json` - Vercel deployment configuration
- `.env.example` - Environment variable template
- `.gitignore` - Files to exclude from git

## Environment Variables for Vercel

In your Vercel dashboard, set these environment variables:

### Required Variables
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Variables
```
VITE_API_BASE_URL= (leave empty for Supabase-only backend)
```

## Deployment Steps

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set the environment variables in Vercel dashboard
4. Deploy!

## Build Configuration
- Build Command: `vite build`
- Output Directory: `dist/public`
- Install Command: `npm install`

## Development vs Production
- **Development**: Use Replit with `npm run dev` for full-stack development
- **Production**: Vercel hosts the frontend, Supabase handles all backend services