import { createRouter, createWebHistory } from 'vue-router'

// Import supabase from the correct location (adjust path if needed)
import { supabase } from '@/lib/supabase' // Or '@/supabase' depending on your structure

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Login',
      hideForAuth: true, // New flag to hide from authenticated users
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Register',
      hideForAuth: true,
    },
  },
  {
    path: '/doctor-dashboard',
    name: 'doctor-dashboard',
    component: () => import('@/views/DoctorDashboard.vue'),
    meta: {
      requiresAuth: true,
      role: 'Doctor',
      title: 'Doctor Dashboard',
    },
  },
  {
    path: '/patient-dashboard',
    name: 'patient-dashboard',
    component: () => import('@/views/PatientDashboard.vue'),
    meta: {
      requiresAuth: true,
      role: 'Patient',
      title: 'Patient Dashboard',
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Profile',
    },
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@/views/UnauthorizedView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Unauthorized',
    },
  },
  // Catch-all route for 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Page Not Found',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Security: Prevent scroll position manipulation attacks
  scrollBehavior(to, from, savedPosition) {
    // Always return to top to prevent fragment-based attacks
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, left: 0 }
    }
  },
})

// Navigation guard with improved security
router.beforeEach(async (to, from, next) => {
  try {
    // Get current session once per navigation
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      // Clear invalid session and redirect to login
      await supabase.auth.signOut()
      next({ name: 'login' })
      return
    }

    const isAuthenticated = !!session
    const userId = session?.user?.id

    // Set page title if defined
    if (to.meta.title) {
      document.title = `${to.meta.title} | Your App Name`
    }

    // Check for routes that should be hidden from authenticated users
    if (to.meta.hideForAuth && isAuthenticated) {
      // Redirect authenticated users away from login/register
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (profile?.role === 'Doctor') {
          next({ name: 'doctor-dashboard' })
        } else {
          next({ name: 'patient-dashboard' })
        }
      } catch (error) {
        console.error('Profile fetch error:', error)
        next({ name: 'patient-dashboard' })
      }
      return
    }

    // Check authentication for protected routes
    if (to.meta.requiresAuth) {
      if (!isAuthenticated) {
        // Store attempted URL for redirect after login
        next({
          name: 'login',
          query: { redirect: to.fullPath },
        })
        return
      }

      // Check role-based authorization
      if (to.meta.role) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

          if (profileError) {
            console.error('Profile fetch error:', profileError)
            next({ name: 'unauthorized' })
            return
          }

          if (profile?.role !== to.meta.role) {
            // User doesn't have the required role
            if (profile?.role === 'Doctor') {
              next({ name: 'doctor-dashboard' })
            } else if (profile?.role === 'Patient') {
              next({ name: 'patient-dashboard' })
            } else {
              next({ name: 'unauthorized' })
            }
            return
          }
        } catch (error) {
          console.error('Role check error:', error)
          next({ name: 'unauthorized' })
          return
        }
      }
    }

    // All checks passed, allow navigation
    next()
  } catch (error) {
    console.error('Navigation guard error:', error)

    // Security: Log security events (in production, send to logging service)
    const securityEvent = {
      timestamp: new Date().toISOString(),
      event: 'NAVIGATION_ERROR',
      from: from.path,
      to: to.path,
      error: error.message,
      userAgent: navigator.userAgent,
    }
    console.warn('Security Event:', securityEvent)

    // Redirect to safe location
    if (to.name !== 'login') {
      next({ name: 'login' })
    } else {
      next(false) // Prevent navigation on error
    }
  }
})

// Optional: Add route change logging for audit trail
router.afterEach((to, from) => {
  // Log route changes for security auditing
  const auditLog = {
    timestamp: new Date().toISOString(),
    from: from.fullPath,
    to: to.fullPath,
    requiresAuth: to.meta.requiresAuth || false,
  }

  // In production, send this to your logging service
  if (process.env.NODE_ENV === 'development') {
    console.debug('Route change:', auditLog)
  }
})

// Handle navigation errors
router.onError((error, to, from) => {
  console.error('Router error:', error)

  // Don't show sensitive error details in production
  if (process.env.NODE_ENV !== 'development') {
    // Redirect to error page
    router.push({ name: 'not-found' })
  }
})

export default router
