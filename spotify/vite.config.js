import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // If using React

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist" // Ensure the output directory is 'dist'
  }
});

