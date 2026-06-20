import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', '@heroicons/react'],
          
          // Module-specific chunks
          'library-module': ['./src/modules/library/LibraryModule.tsx'],
          'notes-module': ['./src/modules/notes/NotesModule.tsx'],
          'healthcare-module': ['./src/modules/healthcare/HealthcareModule.tsx'],
          'settings-module': ['./src/modules/settings/SettingsModule.tsx'],
          
          // Feature chunks
          'charts': ['chart.js', 'react-chartjs-2'],
          'animations': ['lottie-react'],
        },
      },
    },
    sourcemap: true,
    target: 'esnext',
    minify: 'terser',
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 4173,
    host: true,
  },
});