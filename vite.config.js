import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    proxy: {
      '/__s3': {
        target: 'https://s3.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__s3/, ''),
      },
    },
  },
})
