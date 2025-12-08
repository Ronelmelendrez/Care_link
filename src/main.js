import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { supabase } from '.supabase' // Assuming you have a Supabase setup

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

// Authentication guard - FIXED VERSION
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth) {
    try {
      // Get current Supabase session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (session && !error) {
        // User is authenticated, proceed
        next()
      } else {
        // No valid session, redirect to login
        next('/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      next('/login')
    }
  } else {
    // Route doesn't require auth, proceed
    next()
  }
})

app.mount('#app')

// Remove the export default block - it doesn't belong here
// Security headers should be configured in vue.config.js or vercel.json
