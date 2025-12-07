<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { supabase } from '@/supabase' // Adjust import path if needed
import { useRouter } from 'vue-router'

const router = useRouter()

const appointments = ref([]) // Define a reactive variable for appointments
const loading = ref(true) // Loading state
const error = ref(null) // Error state
const selectedAppointment = ref(null) // Store the selected appointment

// Auto-insert profile for logged-in user if not exists
async function autoInsertProfile() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      error.value = 'No user logged in.'
      return
    }
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    if (!profile) {
      // Insert a basic profile (customize as needed)
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        role: 'Patient', // or 'Doctor', or get from user metadata
        first_name: user.user_metadata?.first_name || 'First',
        last_name: user.user_metadata?.last_name || 'Last',
        email: user.email,
        phone: user.user_metadata?.phone || null,
        specialty: user.user_metadata?.specialty || null,
      })
      if (insertError) {
        error.value = 'Failed to auto-create profile: ' + insertError.message
        // Redirect to a profile creation page for manual completion
        router.push('/create-profile')
        return
      }
    }
  } catch (err) {
    error.value = 'Failed to auto-create profile.'
  }
}

onMounted(async () => {
  await autoInsertProfile()
  try {
    // Get the logged-in user's ID from Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const userId = user.id

      // Fetch appointments for the user
      const response = await axios.get(`/api/appointments/${userId}`)
      appointments.value = response.data // Update the reactive variable
    } else {
      console.error('No user logged in.')
      error.value = 'No user logged in.'
    }
  } catch (err) {
    console.error('Error fetching appointments:', err)
    error.value = 'Failed to fetch appointments. Please try again later.'
  } finally {
    loading.value = false // Turn off loading once data is fetched
  }
})

// Function to select an appointment
const selectAppointment = (appointment) => {
  selectedAppointment.value = appointment
}
</script>

<template>
  <div>
    <h1>My Appointments</h1>

    <!-- Loading and error states -->
    <div v-if="loading">Loading...</div>
    <div v-if="error">{{ error }}</div>

    <!-- List of appointments -->
    <ul v-if="!loading && !error">
      <li v-for="appointment in appointments" :key="appointment.id">
        {{ appointment.date }} - {{ appointment.time }}
        <button @click="selectAppointment(appointment)">Select</button>
      </li>
    </ul>

    <!-- Display selected appointment -->
    <div v-if="selectedAppointment">
      <h2>Selected Appointment</h2>
      <p><strong>Date:</strong> {{ selectedAppointment.date }}</p>
      <p><strong>Time:</strong> {{ selectedAppointment.time }}</p>
      <!-- Add more details about the appointment if needed -->
    </div>
  </div>
</template>
