#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('🚀 Starting TJ - Traders Brotherhood (Pure Frontend + Supabase)');
console.log('📦 Express server removed - now using pure Vite + Supabase architecture');
console.log(`🌐 Allowing host: ${process.env.REPLIT_DOMAINS}`);

// Start Vite dev server with exact allowed host via CLI argument
const allowedHost = process.env.REPLIT_DOMAINS || 'localhost';
const vite = spawn('npx', [
  'vite', 
  '--host', '0.0.0.0', 
  '--port', '5000',
  '--force'
], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'production',  // Disable restrictive plugins
    VITE_ALLOWED_HOSTS: allowedHost
  }
});

vite.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  vite.kill('SIGINT');
});

process.on('SIGTERM', () => {
  vite.kill('SIGTERM');
});