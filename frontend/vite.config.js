import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/uploads': {
        target: process.env.VITE_BACKEND_DEV_PROXY || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }})