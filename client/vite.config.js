import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For local testing: the Node backend runs on :3000, Vite on :5173
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000', '/download': 'http://localhost:3000' } }
});