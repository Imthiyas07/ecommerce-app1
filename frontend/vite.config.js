import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and loading
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],

          // UI libraries chunk
          ui: ['react-icons', 'react-toastify'],

          // HTTP client chunk
          http: ['axios'],

          // PDF and utility libraries
          utils: ['jspdf', '@react-pdf/renderer'],

          // Payment libraries
          payment: ['react-to-print'],

          // Large asset libraries (if any)
          assets: ['react-icons/fa', 'react-icons/md', 'react-icons/bs', 'react-icons/ai', 'react-icons/hi']
        },

        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },

        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },

        // Optimize entry file naming
        entryFileNames: 'js/[name]-[hash].js'
      }
    },

    // Enable source maps for production debugging
    sourcemap: false,

    // Optimize build performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },

    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'react-toastify']
  }
})
