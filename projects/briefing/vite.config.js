import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React app runs on port 5174 and the API on port 3002.
// The proxy forwards any request starting with /api to the API, so the
// browser only ever talks to one origin and cookies work without CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3002',
    },
  },
});
