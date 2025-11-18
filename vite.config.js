import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/', // Ensure the correct base URL for assets

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vuetify'], // Optimize chunking by creating a separate chunk for vendor libraries
        },
      },
    },
  },
})
