<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { supabase } from '@/supabase'; // Adjust import path if needed

const appointments = ref([]); // Define a reactive variable for appointments
const loading = ref(true); // Loading state
const error = ref(null); // Error state
const selectedAppointment = ref(null); // Store the selected appointment

// Fetch appointments when the component is mounted
onMounted(async () => {
  try {
    // Get the logged-in user's ID from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userId = user.id;

      // Fetch appointments for the user
      const response = await axios.get(`/api/appointments/${userId}`);
      appointments.value = response.data; // Update the reactive variable
    } else {
      console.error('No user logged in.');
      error.value = 'No user logged in.';
    }
  } catch (err) {
    console.error('Error fetching appointments:', err);
    error.value = 'Failed to fetch appointments. Please try again later.';
  } finally {
    loading.value = false; // Turn off loading once data is fetched
  }
});

// Function to select an appointment
const selectAppointment = (appointment) => {
  selectedAppointment.value = appointment;
};
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
