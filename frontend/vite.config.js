import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          xlsx: ['xlsx'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/storage'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
