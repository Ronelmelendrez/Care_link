import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue')
    },
    {
      path: '/doctor-dashboard',
      name: 'doctor-dashboard',
      component: () => import('@/views/DoctorDashboard.vue'),
      meta: { requiresAuth: true, role: 'Doctor' }
    },
    {
      path: '/patient-dashboard',
      name: 'patient-dashboard',
      component: () => import('@/views/PatientDashboard.vue'),
      meta: { requiresAuth: true, role: 'Patient' }
    },
    // Catch-all route for 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/'
    }
  ]
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  try {
    // Allow access to login and register without authentication
    if (to.name === 'login' || to.name === 'register') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'Doctor') {
          next({ name: 'doctor-dashboard' })
        } else {
          next({ name: 'patient-dashboard' })
        }
        return
      }
      next()
      return
    }

    // Check authentication for protected routes
    if (to.meta.requiresAuth) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        next({ name: 'login' })
        return
      }

      // Check role if required
      if (to.meta.role) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== to.meta.role) {
          if (profile?.role === 'Doctor') {
            next({ name: 'doctor-dashboard' })
          } else {
            next({ name: 'patient-dashboard' })
          }
          return
        }
      }
    }
    next()
  } catch (error) {
    console.error('Navigation guard error:', error)
    next({ name: 'login' })
  }
})

export default router
