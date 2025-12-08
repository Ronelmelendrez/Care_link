import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase environment variables!')
  console.error('Please create a .env file with:')
  console.error('VITE_SUPABASE_URL=your-project-url')
  console.error('VITE_SUPABASE_ANON_KEY=your-anon-key')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token', // Custom storage key
    storage: localStorage, // Consider using more secure storage
  },
  global: {
    headers: {
      'X-Client-Info': 'vue-app',
    },
  },
})
