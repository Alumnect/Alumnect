import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion') || id.includes('motion'))
              return 'vendor-motion'
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (id.includes('react')) return 'vendor-react'
            return 'vendor-libs'
          }
        },
      },
    },
  },
})
