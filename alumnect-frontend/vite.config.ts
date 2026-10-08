import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '../',
  server: {
    port: 5173,
    strictPort: true, // Không dùng port khác nếu 5173 bị chiếm → tránh Google OAuth origin_mismatch
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@vietmap/vietmap-gl-js': path.resolve(__dirname, './node_modules/@vietmap/vietmap-gl-js/dist/vietmap-gl.js'),
    },
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion') || id.includes('motion'))
              return 'vendor-motion'
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('lucide-react') || id.includes('@phosphor-icons'))
              return 'vendor-icons'
            if (id.includes('@tanstack/react-query')) return 'vendor-query'
            if (id.includes('zod')) return 'vendor-zod'
            if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react'
            return 'vendor-libs'
          }
        },
      },
    },
  },
  // Pre-bundle các thư viện nặng để tăng tốc HMR trong dev
  optimizeDeps: {
    include: ['framer-motion', 'react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
})
