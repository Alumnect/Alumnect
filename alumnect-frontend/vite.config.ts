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
          if (!id.includes('node_modules')) return
          const pkg = id
            .replace(/\\/g, '/')
            .match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/)?.[1]
          if (!pkg) return
          // Lõi chạy ngay khi mở app
          if (pkg === 'react' || pkg === 'react-dom' || pkg === 'scheduler') return 'vendor-react'
          if (pkg === 'react-router' || pkg === 'react-router-dom') return 'vendor-router'
          if (pkg === 'framer-motion' || pkg === 'motion' || pkg.startsWith('motion-')) return 'vendor-motion'
          if (pkg === 'lucide-react' || pkg === '@phosphor-icons/react') return 'vendor-icons'
          if (pkg.startsWith('@tanstack/')) return 'vendor-query'
          if (pkg === 'zod') return 'vendor-zod'
          // Còn lại (maplibre, docx-preview, react-datepicker, axios…): để bundler tự tách theo nơi dùng →
          // thư viện chỉ dùng ở route lazy sẽ không nằm trong gói tải ban đầu
        },
      },
    },
  },
  // Pre-bundle các thư viện nặng để tăng tốc HMR trong dev
  optimizeDeps: {
    include: ['framer-motion', 'react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
})
