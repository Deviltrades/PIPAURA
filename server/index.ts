#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('🚀 Starting TJ - Traders Brotherhood (Pure Frontend + Supabase)');
console.log('📦 Express server removed - now using pure Vite + Supabase architecture');

// Start Vite dev server with allowed hosts for Replit preview
const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5000', '--no-clearScreen'], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    VITE_ALLOWED_HOSTS: '.replit.dev'
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