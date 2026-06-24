import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PWA is handled with a hand-written manifest.webmanifest (linked from index.html)
// and a tiny service worker registered in main.tsx, so the build never needs
// network access at install time.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
