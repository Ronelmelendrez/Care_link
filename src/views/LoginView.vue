<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref(null)
const showPassword = ref(false)

const form = ref({
  email: '',
  password: '',
  role: ''
})

const roles = [
  { title: 'Patient', icon: 'mdi-account-heart', color: 'primary', description: 'Book and manage your appointments' },
  { title: 'Doctor', icon: 'mdi-doctor', color: 'success', description: 'Manage your schedule and patients' }
]

const isFormValid = computed(() => {
  return form.value.email && 
         form.value.password && 
         form.value.role &&
         form.value.email.includes('@')
})

async function handleLogin() {
  try {
    loading.value = true
    error.value = null
    
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.value.email,
      password: form.value.password,
    })

    if (authError) throw authError

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError

    if (profile.role !== form.value.role) {
      throw new Error(`Invalid role selected. You are registered as a ${profile.role}`)
    }

    if (profile.role === 'Doctor') {
      router.push('/doctor-dashboard')
    } else {
      router.push('/patient-dashboard')
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-app>
    <div class="background-pattern"></div>
    <AppLayout>
      <template #content>
        <v-container fluid class="fill-height pa-0">
          <v-row class="fill-height ma-0" align="center" justify="center">
            <!-- Left Side: Welcome Section -->
            <v-col cols="12" md="6" class="d-flex align-center justify-center pa-6">
              <div class="welcome-section text-center">
                <div class="logo-container mb-6">
                  <v-icon size="64" color="primary" class="logo-icon">mdi-hospital-building</v-icon>
                  <div class="logo-text">CareLink</div>
                </div>
                <h1 class="welcome-title text-h3 font-weight-bold mb-4">
                  Welcome to CareLink
                </h1>
                <p class="welcome-subtitle text-h6 text-medium-emphasis mb-8">
                  Your trusted University Clinic Appointment System
                </p>
                <v-sheet
                  class="features-grid mx-auto"
                  max-width="600"
                  rounded="lg"
                  elevation="0"
                >
                  <div class="feature-item">
                    <v-icon color="primary" size="32" class="mb-2">mdi-calendar-check</v-icon>
                    <h3 class="text-h6 mb-1">Easy Scheduling</h3>
                    <p class="text-body-2 text-medium-emphasis">Book appointments with just a few clicks</p>
                  </div>
                  <div class="feature-item">
                    <v-icon color="success" size="32" class="mb-2">mdi-doctor</v-icon>
                    <h3 class="text-h6 mb-1">Expert Care</h3>
                    <p class="text-body-2 text-medium-emphasis">Connect with qualified healthcare professionals</p>
                  </div>
                  <div class="feature-item">
                    <v-icon color="info" size="32" class="mb-2">mdi-clock-fast</v-icon>
                    <h3 class="text-h6 mb-1">Real-time Updates</h3>
                    <p class="text-body-2 text-medium-emphasis">Get instant notifications about your appointments</p>
                  </div>
                  <div class="feature-item">
                    <v-icon color="warning" size="32" class="mb-2">mdi-shield-check</v-icon>
                    <h3 class="text-h6 mb-1">Secure Platform</h3>
                    <p class="text-body-2 text-medium-emphasis">Your health data is protected and private</p>
                  </div>
                </v-sheet>
              </div>
            </v-col>

            <!-- Right Side: Login Form -->
            <v-col cols="12" md="6" class="d-flex align-center justify-center pa-6">
              <v-card
                class="login-card mx-auto"
                elevation="8"
                max-width="500"
                min-width="300"
                rounded="lg"
              >
                <v-card-text class="pa-8">
                  <h2 class="text-h4 font-weight-bold text-center mb-6">Login</h2>

                  <v-form @submit.prevent="handleLogin" class="login-form">
                    <v-alert
                      v-if="error"
                      type="error"
                      variant="tonal"
                      closable
                      class="mb-4"
                      @click:close="error = null"
                    >
                      {{ error }}
                    </v-alert>

                    <!-- Role Selection -->
                    <div class="role-selection mb-6">
                      <label class="text-subtitle-1 mb-3 d-block">I am a:</label>
                      <div class="role-cards">
                        <v-card
                          v-for="role in roles"
                          :key="role.title"
                          :class="['role-card', { 'selected': form.role === role.title }]"
                          @click="form.role = role.title"
                          elevation="2"
                        >
                          <v-icon :color="role.color" size="32" class="mb-2">{{ role.icon }}</v-icon>
                          <div class="text-h6 mb-1">{{ role.title }}</div>
                          <div class="text-caption text-medium-emphasis">{{ role.description }}</div>
                        </v-card>
                      </div>
                    </div>

                    <!-- Email Field -->
                    <v-text-field
                      v-model="form.email"
                      label="Email"
                      type="email"
                      variant="outlined"
                      :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Invalid email']"
                      prepend-inner-icon="mdi-email"
                      class="mb-4"
                      required
                    ></v-text-field>

                    <!-- Password Field -->
                    <v-text-field
                      v-model="form.password"
                      label="Password"
                      :type="showPassword ? 'text' : 'password'"
                      variant="outlined"
                      :rules="[v => !!v || 'Password is required']"
                      prepend-inner-icon="mdi-lock"
                      :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                      @click:append-inner="showPassword = !showPassword"
                      class="mb-6"
                      required
                    ></v-text-field>

                    <!-- Login Button -->
                    <v-btn
                      type="submit"
                      color="primary"
                      size="large"
                      block
                      :loading="loading"
                      :disabled="!isFormValid"
                      class="mb-4 login-btn"
                      elevation="2"
                    >
                      <v-icon left class="mr-2">mdi-login</v-icon>
                      Login
                    </v-btn>

                    <!-- Register Link -->
                    <div class="text-center">
                      <span class="text-medium-emphasis">Don't have an account?</span>
                      <router-link to="/register" class="text-primary font-weight-bold ml-2">
                        Register here
                      </router-link>
                    </div>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </AppLayout>
  </v-app>
</template>

<style scoped>
/* Background Pattern */
.background-pattern {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  background-image: radial-gradient(#1976d2 0.5px, transparent 0.5px), radial-gradient(#1976d2 0.5px, #f5f5f5 0.5px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  opacity: 0.1;
  z-index: 0;
}

/* Logo Styles */
.logo-container {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  animation: fadeInDown 0.8s ease-out;
}

.logo-icon {
  filter: drop-shadow(0 2px 5px rgba(25, 118, 210, 0.2));
}

.logo-text {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-top: 0.5rem;
}

.welcome-section {
  position: relative;
  z-index: 1;
  padding: 2rem;
  max-width: 800px;
}

.welcome-title {
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fadeInUp 0.8s ease-out;
}

.welcome-subtitle {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  animation: fadeInUp 0.8s ease-out 0.4s both;
  background: rgba(255, 255, 255, 0.7);
  padding: 2rem;
}

.feature-item {
  text-align: center;
  padding: 1.5rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  animation: fadeInRight 0.8s ease-out;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

/* Role Selection Cards */
.role-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.role-card {
  cursor: pointer;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.role-card:hover {
  transform: translateY(-2px);
}

.role-card.selected {
  border-color: #1976d2;
  background: rgba(25, 118, 210, 0.05);
}

.login-btn {
  transition: all 0.3s ease;
}

.login-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive Design */
@media (max-width: 960px) {
  .welcome-section {
    padding: 1.5rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }

  .welcome-title {
    font-size: 2rem !important;
  }

  .welcome-subtitle {
    font-size: 1.1rem !important;
  }

  .login-card {
    margin: 1rem;
  }

  .v-card-text {
    padding: 1.5rem !important;
  }
}

@media (max-width: 600px) {
  .role-cards {
    grid-template-columns: 1fr;
  }

  .role-card {
    padding: 1rem;
  }

  .v-card-text {
    padding: 1rem !important;
  }

  .welcome-title {
    font-size: 1.75rem !important;
  }

  .logo-text {
    font-size: 1.5rem;
  }

  .features-grid {
    padding: 0.5rem;
  }

  .feature-item {
    padding: 1rem;
  }
}

/* Error Animation */
.v-alert {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

/* Improve form field focus states */
.v-text-field:focus-within {
  transform: translateY(-2px);
  transition: transform 0.3s ease;
}

/* Add loading state animation */
.v-btn--loading {
  background: linear-gradient(45deg, #1976d2, #42a5f5);
}

/* Add hover transitions */
.v-btn,
.role-card,
.feature-item {
  transition: all 0.3s ease;
}

/* Ensure container fills height on mobile */
.v-container {
  min-height: 100vh;
}

/* Add scroll behavior for mobile */
@media (max-height: 800px) {
  .v-container {
    padding-top: 2rem;
    padding-bottom: 2rem;
    height: auto;
    min-height: auto;
  }
}
</style>