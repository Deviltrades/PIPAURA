#!/usr/bin/env node
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { setupCronRoutes } from './cron-routes.js';

const app = express();
const PORT = 5000;
const VITE_PORT = 5173; // Internal Vite port

// Parse JSON bodies for cron endpoints
app.use(express.json());

// Setup cron API routes first (these take priority)
setupCronRoutes(app);

// Proxy everything else to Vite dev server
app.use(createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying for HMR
  // Don't proxy cron API routes
  filter: (pathname) => !pathname.startsWith('/api/cron'),
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Proxy server with Cron API running on port ${PORT}`);
  console.log(`📡 Cron endpoints ready on /api/cron/*`);
  console.log(`🔄 Proxying all other requests to Vite on port ${VITE_PORT}\n`);
});
