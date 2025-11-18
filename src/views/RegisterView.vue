<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref(null)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showSuccessDialog = ref(false)
const showErrorDialog = ref(false)
const successMessage = ref('')
const errorDetails = ref('')

const roles = [
  { 
    title: 'Patient', 
    icon: 'mdi-account-heart', 
    color: 'primary',
    description: 'Register as a patient to book appointments'
  },
  { 
    title: 'Doctor', 
    icon: 'mdi-doctor', 
    color: 'success',
    description: 'Register as a healthcare provider'
  }
]

const form = ref({
  role: '',
  id_number: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  specialty: ''
})

const specialties = [
  'General Medicine',
  'Pediatrics',
  'Dentistry',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Psychiatry',
  'Family Medicine'
]

const rules = {
  required: v => !!v || 'This field is required',
  email: v => /.+@.+\..+/.test(v) || 'Please enter a valid email',
  phone: v => /^\d{10}$/.test(v) || 'Please enter a valid 10-digit phone number',
  password: v => v.length >= 6 || 'Password must be at least 6 characters',
  passwordMatch: v => v === form.value.password || 'Passwords do not match',
}

const isFormValid = computed(() => {
  const baseValidation = form.value.role &&
         form.value.firstName &&
         form.value.lastName &&
         form.value.email &&
         form.value.password &&
         form.value.confirmPassword === form.value.password &&
         form.value.email.includes('@')

  if (form.value.role === 'Doctor') {
    return baseValidation && form.value.specialty
  }

  return baseValidation
})

async function handleRegister() {
  try {
    loading.value = true
    error.value = null

    if (!isFormValid.value) {
      throw new Error('Please fill in all required fields correctly')
    }

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', form.value.email)
      .single()

    if (existingUser) {
      throw new Error('This email is already registered')
    }

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: form.value.email,
      password: form.value.password,
    })

    if (signUpError) throw signUpError

    const profileData = {
      id: user.id,
      role: form.value.role,
      first_name: form.value.firstName,
      last_name: form.value.lastName,
      email: form.value.email,
      created_at: new Date().toISOString()
    }

    if (form.value.role === 'Doctor') {
      profileData.specialty = form.value.specialty
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)

    if (profileError) throw profileError

    successMessage.value = 'Registration successful! Please check your email for verification.'
    showSuccessDialog.value = true

    form.value = {
      role: '',
      id_number: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      specialty: ''
    }

    setTimeout(() => {
    router.push('/login')
    }, 3000)

  } catch (e) {
    errorDetails.value = e.message
    showErrorDialog.value = true
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
                  Join CareLink Today
                </h1>
                <p class="welcome-subtitle text-h6 text-medium-emphasis mb-8">
                  Create your account to access our healthcare services
                </p>
                <v-sheet
                  class="features-grid mx-auto"
                  max-width="600"
                  rounded="lg"
                  elevation="0"
                >
                  <div class="feature-item">
                    <v-icon color="success" size="32" class="mb-2">mdi-account-check</v-icon>
                    <h3 class="text-h6 mb-1">Easy Registration</h3>
                    <p class="text-body-2 text-medium-emphasis">Quick and simple account creation</p>
                  </div>
                  <div class="feature-item">
                    <v-icon color="info" size="32" class="mb-2">mdi-shield-check</v-icon>
                    <h3 class="text-h6 mb-1">Secure Platform</h3>
                    <p class="text-body-2 text-medium-emphasis">Your data is safe with us</p>
                  </div>
                  <div class="feature-item">
                    <v-icon color="warning" size="32" class="mb-2">mdi-calendar-check</v-icon>
                    <h3 class="text-h6 mb-1">Instant Access</h3>
                    <p class="text-body-2 text-medium-emphasis">Book appointments right away</p>
                  </div>
                  <div class="feature-item">
                    <v-icon color="error" size="32" class="mb-2">mdi-heart-pulse</v-icon>
                    <h3 class="text-h6 mb-1">Quality Care</h3>
                    <p class="text-body-2 text-medium-emphasis">Connect with healthcare experts</p>
                  </div>
                </v-sheet>
              </div>
            </v-col>

            <!-- Right Side: Registration Form -->
            <v-col cols="12" md="6" class="d-flex align-center justify-center pa-6">
              <v-card
                class="register-card mx-auto"
                elevation="8"
                max-width="600"
                min-width="300"
                rounded="lg"
              >
                <v-card-text class="pa-8">
                  <h2 class="text-h4 font-weight-bold text-center mb-6">Create Account</h2>

                  <v-form @submit.prevent="handleRegister" class="register-form">
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
                      <label class="text-subtitle-1 mb-3 d-block">I want to register as:</label>
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

                    <v-expand-transition>
                <v-select
                        v-if="form.role === 'Doctor'"
                        v-model="form.specialty"
                        :items="specialties"
                        label="Select Specialty"
                  variant="outlined"
                  :rules="[rules.required]"
                        prepend-inner-icon="mdi-stethoscope"
                        class="mb-4"
                  required
                      >
                        <template v-slot:prepend>
                          <v-tooltip
                            text="Choose your medical specialty"
                            location="bottom"
                          >
                            <template v-slot:activator="{ props }">
                              <v-icon
                                v-bind="props"
                                color="primary"
                                icon="mdi-help-circle"
                                class="mr-2"
                              ></v-icon>
                            </template>
                          </v-tooltip>
                        </template>
                      </v-select>
                    </v-expand-transition>

                    <v-row>
                      <!-- ID Number -->
                      <v-col cols="12">
              
                      </v-col>

                      <!-- First Name -->
                      <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.firstName"
                  label="First Name"
                  variant="outlined"
                  :rules="[rules.required]"
                          prepend-inner-icon="mdi-account"
                  required
                ></v-text-field>
                      </v-col>

                      <!-- Last Name -->
                      <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.lastName"
                  label="Last Name"
                  variant="outlined"
                  :rules="[rules.required]"
                          prepend-inner-icon="mdi-account"
                  required
                ></v-text-field>
                      </v-col>

                      <!-- Email -->
                      <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.email"
                  label="Email"
                          type="email"
                  variant="outlined"
                  :rules="[rules.required, rules.email]"
                          prepend-inner-icon="mdi-email"
                  required
                ></v-text-field>
                      </v-col>

                      <!-- Phone -->
                      <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.phone"
                  label="Phone Number"
                  variant="outlined"
                  :rules="[rules.required, rules.phone]"
                          prepend-inner-icon="mdi-phone"
                  required
                ></v-text-field>
                      </v-col>

                      <!-- Password -->
                      <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.password"
                  label="Password"
                          :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  :rules="[rules.required, rules.password]"
                          prepend-inner-icon="mdi-lock"
                          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                          @click:append-inner="showPassword = !showPassword"
                  required
                ></v-text-field>
                      </v-col>

                      <!-- Confirm Password -->
                      <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.confirmPassword"
                  label="Confirm Password"
                          :type="showConfirmPassword ? 'text' : 'password'"
                  variant="outlined"
                  :rules="[rules.required, rules.passwordMatch]"
                          prepend-inner-icon="mdi-lock-check"
                          :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                          @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  required
                ></v-text-field>
                      </v-col>
                    </v-row>

                    <!-- Register Button -->
                <v-btn
                  type="submit"
                      color="primary"
                      size="large"
                  block
                  :loading="loading"
                      :disabled="!isFormValid"
                      class="mt-4 register-btn"
                      elevation="2"
                >
                      <v-icon left class="mr-2">mdi-account-plus</v-icon>
                      Create Account
                </v-btn>

                    <!-- Login Link -->
                    <div class="text-center mt-6">
                      <span class="text-medium-emphasis">Already have an account?</span>
                      <router-link to="/login" class="text-primary font-weight-bold ml-2">
                        Login here
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

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="400" persistent>
      <v-card class="success-dialog">
        <v-card-text class="pa-6">
          <div class="text-center mb-4">
            <v-icon color="success" size="64" class="mb-4">mdi-check-circle</v-icon>
            <h3 class="text-h5 font-weight-bold success-title">Registration Successful!</h3>
          </div>
          <p class="text-body-1 text-center mb-4">{{ successMessage }}</p>
          <div class="text-center">
            <v-progress-circular
              indeterminate
              color="primary"
              class="mb-2"
            ></v-progress-circular>
            <p class="text-caption">Redirecting to login page...</p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Error Dialog -->
    <v-dialog v-model="showErrorDialog" max-width="400">
      <v-card class="error-dialog">
        <v-card-text class="pa-6">
          <div class="text-center mb-4">
            <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
            <h3 class="text-h5 font-weight-bold error-title">Registration Failed</h3>
          </div>
          <p class="text-body-1 text-center mb-4">{{ errorDetails }}</p>
          <v-btn
            color="error"
            block
            @click="showErrorDialog = false"
            variant="tonal"
          >
            Close
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
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

/* Welcome Section */
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

/* Features Grid */
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

/* Registration Card */
.register-card {
  position: relative;
  z-index: 1;
  width: 100%;
  animation: fadeInRight 0.8s ease-out;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

/* Role Selection */
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

/* Button Styles */
.register-btn {
  transition: all 0.3s ease;
}

.register-btn:not(:disabled):hover {
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

  .register-card {
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

/* Form Field Focus States */
.v-text-field:focus-within {
  transform: translateY(-2px);
  transition: transform 0.3s ease;
}

/* Loading State */
.v-btn--loading {
  background: linear-gradient(45deg, #1976d2, #42a5f5);
}

/* Container Height */
.v-container {
  min-height: 100vh;
}

/* Mobile Scroll Behavior */
@media (max-height: 800px) {
  .v-container {
    padding-top: 2rem;
    padding-bottom: 2rem;
    height: auto;
    min-height: auto;
  }
}

/* Dialog Styles */
.success-dialog,
.error-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.success-dialog {
  background: linear-gradient(to bottom right, #ffffff, #f0fff4);
}

.error-dialog {
  background: linear-gradient(to bottom right, #ffffff, #fff5f5);
}

.success-title {
  color: #2e7d32;
}

.error-title {
  color: #d32f2f;
}

/* Dialog Animation */
.v-dialog-transition-enter-active,
.v-dialog-transition-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-dialog-transition-enter-from,
.v-dialog-transition-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

/* Progress Animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.v-progress-circular {
  animation: spin 1s linear infinite;
}

/* Specialty Field Animation */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.3s ease-out;
}

.v-expand-transition-enter-from,
.v-expand-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.v-expand-transition-enter-to,
.v-expand-transition-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
