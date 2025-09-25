# Frontend-Only Deployment Guide

This document explains how to deploy just the frontend of the TJ - Traders Brotherhood application as a static site on Replit.

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API Configuration
VITE_API_BASE_URL=https://your-backend-api.com
```

### 2. Build the Frontend

Run the following command to build the frontend:

```bash
vite build
```

This will create a `dist/public` directory with all the static files.

### 3. Deploy to Replit Static Hosting

1. Open the **Publishing** workspace tool in Replit
2. Select **Static** deployment type
3. Click **Set up your published app**
4. Configure the following settings:
   - **Public directory**: `dist/public`
   - **Build command**: `vite build`
5. Click **Publish** to deploy your static site

### 4. Environment Variables for Production

After deploying, you'll need to set up environment variables in your Replit deployment:

1. Go to your deployment settings
2. Add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`  
   - `VITE_API_BASE_URL`

### 5. Backend Requirements

Your backend needs to:

1. **Enable CORS** for your frontend domain
2. **Handle authentication** via Supabase JWT tokens
3. **Provide the following API endpoints**:
   - `POST /api/journal-entries` - Create journal entry
   - `GET /api/journal-entries` - Get journal entries
   - `PUT /api/journal-entries/:id` - Update journal entry
   - `DELETE /api/journal-entries/:id` - Delete journal entry
   - `POST /api/tags` - Create tag
   - `GET /api/tags` - Get tags
   - `PUT /api/tags/:id` - Update tag
   - `DELETE /api/tags/:id` - Delete tag
   - `GET /api/user/profile` - Get user profile
   - `POST /api/upload-image` - Upload images

### 6. CORS Configuration

Your backend should allow requests from your Replit frontend domain. Example CORS configuration:

```javascript
// Express.js example
app.use(cors({
  origin: ['https://your-replit-app.replit.app'],
  credentials: true
}));
```

## Features Available in Frontend-Only Mode

- ✅ User authentication via Supabase
- ✅ Trading journal entry creation/editing
- ✅ Tag management
- ✅ Analytics dashboard
- ✅ Calendar view
- ✅ File uploads (via backend API)
- ✅ Responsive design
- ✅ Dark/light theme

## Limitations

- Backend API must be hosted separately
- Real-time features depend on backend implementation
- File storage requires backend API endpoints

## Troubleshooting

1. **API calls failing**: Check that `VITE_API_BASE_URL` is correctly set
2. **Authentication issues**: Verify Supabase configuration
3. **CORS errors**: Ensure backend allows requests from your frontend domain
4. **Build failures**: Check that all environment variables are set during build