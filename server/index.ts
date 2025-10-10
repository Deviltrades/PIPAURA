#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('🚀 Starting TJ - Traders Brotherhood');
console.log('📦 Frontend: Vite + Supabase | API: Cron endpoints');
console.log(`🌐 Allowing host: ${process.env.REPLIT_DOMAINS}`);

// Start Vite dev server on internal port 5173
const allowedHost = process.env.REPLIT_DOMAINS || 'localhost';
const vite = spawn('npx', [
  'vite', 
  '--config', 'vite.replit.config.ts',
  '--host', '0.0.0.0', 
  '--port', '5173',  // Internal port
  '--force'
], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    VITE_REPLIT_HOST: allowedHost
  }
});

// Start proxy server with Cron API on port 5000 (public port)
const proxy = spawn('tsx', ['server/proxy-with-cron.ts'], {
  stdio: 'inherit',
  env: process.env
});

vite.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
  proxy.kill();
  process.exit(code);
});

proxy.on('close', (code) => {
  console.log(`Proxy process exited with code ${code}`);
  vite.kill();
  process.exit(code);
});

process.on('SIGINT', () => {
  vite.kill('SIGINT');
  proxy.kill('SIGINT');
});

process.on('SIGTERM', () => {
  vite.kill('SIGTERM');
  proxy.kill('SIGTERM');
});