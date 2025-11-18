<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Vue Router instance
const router = useRouter();
const route = useRoute();

// Retrieve the query parameter `item` from the route
const selectedItem = route.query.item;

// Refs to store the selected date and time of day (morning/afternoon)
const date = ref(null);
const timeOfDay = ref(null);

// Function to handle the submission of the selected date and time of day
function submitDateTime() {
  if (date.value && timeOfDay.value) {
    alert(
      `You have submitted the date: ${date.value} and time of day: ${timeOfDay.value}`
    );
    console.log(
      `Selected item: ${selectedItem}, Date: ${date.value}, Time of Day: ${timeOfDay.value}`
    );
  } else {
    alert('Please select both a date and a time of day before submitting.');
  }
}

// Function to submit the appointment and navigate to the profile dashboard
function submitAppointment() {
  if (date.value && timeOfDay.value) {
    alert('Appointment submitted successfully!');
    router.push({ name: 'profile-dashboard' });
  } else {
    alert('Please complete your selections.');
  }
}

// Function to navigate back
function goBack() {
  router.back(); // Goes to the previous page in the history
}

// Example of allowed dates (this can be customized)
const allowedDates = (val) => {
  const day = new Date(val).getDay();
  return day !== 0 && day !== 6; // Allow weekdays only
};
</script>

<template>
  <div class="appointment-container">
    <!-- Back Button -->
    <v-btn color="grey darken-1" class="back-button" @click="goBack">
      ← Back
    </v-btn>

    <h1 class="mt-5 ml-6">Choose Your Preferred Schedule</h1>
    <p class="ml-6">Selected Item: <strong>{{ selectedItem }}</strong></p>

    <v-container>
      <!-- Date Picker Section -->
      <v-row class="calendar">
        <v-col :cols="8" class="text-center">
          <v-date-picker
            v-model="date"
            :allowed-dates="allowedDates"
            max="2080-03-20"
            min="2025-01-15"
            label="Select a Date"
            class="scaled-calendar"
          ></v-date-picker>
          <p v-if="date" class="feedback-text">
            Selected Date: {{ date }}
          </p>
        </v-col>

        <!-- Morning or Afternoon Selection Section -->
        <v-col :cols="2" class="time">
          <v-radio-group
            v-if="date"
            v-model="timeOfDay"
            label="Appointment Time:"
          >
            <v-radio label="Morning" value="morning"></v-radio>
            <v-radio label="Afternoon" value="afternoon"></v-radio>
          </v-radio-group>
          <p v-if="timeOfDay" class="feedback-text">
            Selected Time: {{ timeOfDay }}
          </p>
        </v-col>
      </v-row>

      <!-- Submit Button -->
      <v-row justify="end" class="submitappointment">
        <v-btn
          color="green darken-3"
          :disabled="!date || !timeOfDay"
          @click="submitAppointment"
        >
          Submit Appointment
        </v-btn>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.time {
  margin-top: 30px;
  margin-left: 200px;
}

/* General container styling */
.appointment-container {
  background-color: #f0f8ff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Calendar scaling */
.scaled-calendar {
  transform: scale(1.0);
  transform-origin: center;
  width: 100%;
  margin-top: 20px;
  border-radius: 10px;
}
.v-col {
  width: 100%;
  max-width: 700px;
}

/* Back button styling */
.back-button {
  margin-bottom: 20px;
  margin-left: 10px;
}

/* Feedback text for interactivity */
.feedback-text {
  margin-top: 30px;
  color: #2d8c45;
  font-size: 14px;
  font-style: italic;
}

/* Button styling */
.v-btn {
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.v-btn:disabled {
  background-color: #d3d3d3;
  cursor: not-allowed;
}
</style>
