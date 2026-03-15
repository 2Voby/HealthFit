import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Avoid unsupported modern syntax (e.g. private class fields in dependencies)
    // on older Safari/iOS Safari versions.
    target: ['es2019', 'safari13'],
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'safari13',
    },
  },
  server: {
    allowedHosts: ['nonparasitically-unrestored-luz.ngrok-free.dev'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
