#!/usr/bin/env node

// Production start script that bypasses all vite.config imports
import { spawn } from 'child_process';

console.log('🚀 Starting WannaWee in production mode...');

const child = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

child.on('exit', (code) => {
  process.exit(code);
});