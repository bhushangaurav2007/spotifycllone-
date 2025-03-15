import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  server: {
    proxy: mode === 'development' ? {
      '/music': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    } : {
      '/music': {
        target: 'https://spotifycllone.onrender.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  plugins: [react()],
}));

