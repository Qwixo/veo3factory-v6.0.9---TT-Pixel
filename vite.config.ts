import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      input: 'index.html'
    }
  }, // ← this comma was missing
  server: {
    open: '/index.html'
  },
  define: {
    global: 'globalThis',
  }
});
