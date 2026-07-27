import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During local development the React dev server (port 5173) proxies any
// request starting with /api to the Express server (port 5000). In
// production Express serves the built app, so no proxy is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
