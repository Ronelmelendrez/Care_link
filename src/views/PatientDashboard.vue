<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const availableSlots = ref([])
const myAppointments = ref([])
const doctors = ref([])
const selectedDoctor = ref(null)
const loading = ref(false)
const error = ref(null)
const hasAvailableDoctors = computed(() => doctors.value.length > 0)
const noAvailableDoctors = computed(() => !loading.value && doctors.value.length === 0)
const showConfirmDialog = ref(false)
const confirmDialogAction = ref(null)
const confirmDialogItem = ref(null)
const searchQuery = ref('')
const sortBy = ref({ key: 'created_at', order: 'desc' })
const filterStatus = ref('all')
const itemsPerPage = ref(5)
const showTooltip = ref(false)
const tab = ref('active')
const showNotesDialog = ref(false)
const selectedAppointment = ref(null)
const patientProfile = ref(null)

// Helper function to format time
function formatTime(time) {
  if (!time) return '';
  try {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  } catch (e) {
    console.error('Error formatting time:', e)
    return ''
  }
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e)
    return ''
  }
}

// Helper function to get authenticated user
async function getAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('No authenticated user found')
  return user
}

// Fetch all doctors with their available slots
async function fetchDoctors() {
  try {
    loading.value = true
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        specialty,
        email,
        available_slots (
          id,
          date,
          time,
          duration,
          is_booked,
          notes
        )
      `)
      .eq('role', 'Doctor')
      .order('first_name')

    if (fetchError) throw fetchError

    // Process doctors data
    doctors.value = (data || [])
      .map(doctor => {
        // Filter available slots for this doctor
        const doctorSlots = (doctor.available_slots || []).filter(slot => {
          if (!slot?.date || !slot?.time) return false
          const slotDate = new Date(slot.date)
          return !slot.is_booked && slotDate >= today
        })

        return {
        id: doctor.id,
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        specialty: doctor.specialty || 'General Practice',
        fullName: `Dr. ${doctor.first_name} ${doctor.last_name}`,
          email: doctor.email,
          availableSlots: doctorSlots.length,
          slots: doctorSlots.map(slot => ({
            ...slot,
            formattedTime: formatTime(slot.time),
            formattedDate: formatDate(slot.date)
          }))
        }
      })

    // Sort doctors by number of available slots
    doctors.value.sort((a, b) => b.availableSlots - a.availableSlots)

    // Restore selected doctor if exists
    if (selectedDoctor.value?.id) {
      const currentDoctor = doctors.value.find(d => d.id === selectedDoctor.value.id)
      if (currentDoctor) {
        selectedDoctor.value = currentDoctor
        await fetchAvailableSlots(currentDoctor)
      }
    }

    console.log('Fetched doctors:', doctors.value.length)
  } catch (e) {
    error.value = e.message
    console.error('Error fetching doctors:', e)
  } finally {
    loading.value = false
  }
}

// Fetch available slots for selected doctor
async function fetchAvailableSlots(doctor) {
  if (!doctor?.id) return
  
  try {
    loading.value = true
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error: fetchError } = await supabase
      .from('available_slots')
      .select(`
        id,
        date,
        time,
        duration,
        is_booked,
        notes,
        doctor:profiles!doctor_id (
          id,
            first_name,
            last_name,
          specialty,
          email
        ),
        appointments (
          id,
          status,
          notes
        )
      `)
      .eq('doctor_id', doctor.id)
      .eq('is_booked', false)
      .gte('date', today.toISOString().split('T')[0])
      .order('date')
      .order('time')

    if (fetchError) throw fetchError

    availableSlots.value = (data || [])
      .filter(slot => {
        // Filter out slots that have pending or confirmed appointments
        const hasActiveAppointment = slot.appointments?.some(
          app => app.status === 'pending' || app.status === 'confirmed'
        )
        return !hasActiveAppointment
      })
      .map(slot => ({
      ...slot,
      formattedTime: formatTime(slot.time),
        formattedDate: formatDate(slot.date),
        doctorName: `Dr. ${slot.doctor.first_name} ${slot.doctor.last_name}`,
        specialty: slot.doctor.specialty || 'General Practice'
    }))

    console.log(`Found ${availableSlots.value.length} available slots for doctor ${doctor.fullName}`)
  } catch (e) {
    error.value = e.message
    console.error('Error fetching available slots:', e)
  } finally {
    loading.value = false
  }
}

// Fetch appointments for the current patient
async function fetchMyAppointments() {
  try {
    const user = await getAuthUser()
    
    const { data, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        status,
        notes,
        created_at,
        slot:available_slots!slot_id (
          id,
          date,
          time,
          duration,
          notes,
          doctor:profiles!doctor_id (
              first_name,
              last_name,
            specialty,
            email
          )
        )
      `)
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    myAppointments.value = (data || [])
      .filter(appointment => appointment?.slot?.date && appointment?.slot?.time)
      .map(appointment => ({
        id: appointment.id,
        slot_id: appointment.slot.id,
        status: appointment.status,
      formattedTime: formatTime(appointment.slot.time),
        formattedDate: formatDate(appointment.slot.date),
        doctorName: `Dr. ${appointment.slot.doctor.first_name} ${appointment.slot.doctor.last_name}`,
        specialty: appointment.slot.doctor.specialty || 'General Practice',
        date: appointment.slot.date,
        created_at: appointment.created_at,
        notes: appointment.notes
      }))

    console.log('Fetched appointments:', myAppointments.value.length)
  } catch (e) {
    error.value = e.message
    console.error('Error fetching appointments:', e)
  }
}

// Book an appointment
async function bookAppointment(slot) {
  if (!slot?.id) return
  
  try {
    loading.value = true
    const user = await getAuthUser()

    // First check if the slot is still available
    const { data: slotCheck, error: checkError } = await supabase
      .from('available_slots')
      .select(`
        id, 
        is_booked,
        appointments (
          id,
          status
        )
      `)
      .eq('id', slot.id)
      .single()

    if (checkError) throw checkError
    
    // Check both is_booked flag and existing active appointments
    if (slotCheck.is_booked || slotCheck.appointments?.some(
      app => app.status === 'pending' || app.status === 'confirmed'
    )) {
      throw new Error('This slot has already been booked. Please choose another time.')
    }

    // Start transaction
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_id: user.id,
        slot_id: slot.id,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (appointmentError) throw appointmentError

    // Update slot status
    const { error: slotError } = await supabase
      .from('available_slots')
      .update({ is_booked: true })
      .eq('id', slot.id)

    if (slotError) throw slotError

    // Refresh data
    await Promise.all([
      fetchAvailableSlots(selectedDoctor.value),
      fetchMyAppointments()
    ])

    // Show success message
    error.value = null
  } catch (e) {
    error.value = e.message
    console.error('Error booking appointment:', e)
  } finally {
    loading.value = false
  }
}

// Cancel an appointment
async function cancelAppointment(appointment) {
  if (!appointment?.id || !appointment?.slot_id) return
  
  try {
    loading.value = true

    // First check if the appointment can be cancelled
    const { data: appointmentCheck, error: checkError } = await supabase
      .from('appointments')
      .select('status')
      .eq('id', appointment.id)
      .single()

    if (checkError) throw checkError
    if (appointmentCheck.status === 'cancelled') {
      throw new Error('This appointment is already cancelled.')
    }

    // Update appointment status
    const { error: appointmentError } = await supabase
      .from('appointments')
      .update({ 
        status: 'cancelled'
      })
      .eq('id', appointment.id)

    if (appointmentError) throw appointmentError

    // Update slot status
    const { error: slotError } = await supabase
      .from('available_slots')
      .update({ is_booked: false })
      .eq('id', appointment.slot_id)

    if (slotError) throw slotError

    // Refresh data
    await Promise.all([
      fetchAvailableSlots(selectedDoctor.value),
      fetchMyAppointments()
    ])

    // Clear any existing error
    error.value = null
    
    // Close confirmation dialog
    showConfirmDialog.value = false
    confirmDialogItem.value = null
    confirmDialogAction.value = null
  } catch (e) {
    error.value = e.message
    console.error('Error cancelling appointment:', e)
  } finally {
    loading.value = false
  }
}

// Delete a cancelled appointment
async function deleteAppointment(appointment) {
  if (!appointment?.id) return
  
  try {
    loading.value = true
    
    // First check if the appointment can be deleted
    const { data: appointmentCheck, error: checkError } = await supabase
      .from('appointments')
      .select('status')
      .eq('id', appointment.id)
      .single()

    if (checkError) throw checkError
    if (appointmentCheck.status !== 'cancelled') {
      throw new Error('Only cancelled appointments can be deleted.')
    }

    // Delete the appointment
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id)
      .eq('status', 'cancelled') // Extra safety check

    if (deleteError) throw deleteError

    // Refresh appointments
    await fetchMyAppointments()

    // Clear any existing error
    error.value = null
    
    // Close confirmation dialog
    showConfirmDialog.value = false
    confirmDialogItem.value = null
    confirmDialogAction.value = null
  } catch (e) {
    error.value = e.message
    console.error('Error deleting appointment:', e)
  } finally {
    loading.value = false
  }
}

// Handle doctor selection change
async function handleDoctorChange() {
  if (selectedDoctor.value?.id) {
    localStorage.setItem('selectedDoctorId', selectedDoctor.value.id)
    await fetchAvailableSlots(selectedDoctor.value)
  } else {
    localStorage.removeItem('selectedDoctorId')
    availableSlots.value = []
  }
}

async function handleLogout() {
  try {
    loading.value = true
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError
    router.push('/login')
  } catch (e) {
    error.value = e.message
    console.error('Error during logout:', e)
  } finally {
    loading.value = false
  }
}

// Add computed properties for filtered and sorted appointments
const filteredAppointments = computed(() => {
  let filtered = [...myAppointments.value]
  
  // Apply status filter
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(app => app.status === filterStatus.value)
  }

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(app => 
      app.doctorName.toLowerCase().includes(query) ||
      app.specialty.toLowerCase().includes(query) ||
      app.status.toLowerCase().includes(query)
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const aValue = sortBy.value.key === 'created_at' 
      ? new Date(a.created_at) 
      : a[sortBy.value.key]
    const bValue = sortBy.value.key === 'created_at' 
      ? new Date(b.created_at) 
      : b[sortBy.value.key]
    
    return sortBy.value.order === 'desc' 
      ? bValue > aValue ? 1 : -1
      : aValue > bValue ? 1 : -1
  })

  return filtered
})

// Add computed properties for active and past appointments
const activeAppointments = computed(() => 
  filteredAppointments.value.filter(app => app.status !== 'cancelled')
)

const pastAppointments = computed(() => 
  filteredAppointments.value.filter(app => app.status === 'cancelled')
)

// Modify the existing cancel appointment function to use confirmation dialog
async function handleCancelAppointment(appointment) {
  confirmDialogAction.value = 'cancel'
  confirmDialogItem.value = appointment
  showConfirmDialog.value = true
}

// Modify the existing delete appointment function to use confirmation dialog
async function handleDeleteAppointment(appointment) {
  confirmDialogAction.value = 'delete'
  confirmDialogItem.value = appointment
  showConfirmDialog.value = true
}

// Add new function to handle dialog confirmation
async function handleConfirmDialog() {
  try {
    loading.value = true
    
    if (confirmDialogAction.value === 'cancel') {
      await cancelAppointment(confirmDialogItem.value)
    } else if (confirmDialogAction.value === 'delete') {
      await deleteAppointment(confirmDialogItem.value)
    }
    
    showConfirmDialog.value = false
    confirmDialogItem.value = null
    confirmDialogAction.value = null
  } catch (e) {
    error.value = e.message
    console.error('Error in confirmation dialog:', e)
  } finally {
    loading.value = false
  }
}

// Add function to get status color
function getStatusColor(status) {
  switch (status) {
    case 'confirmed': return 'success'
    case 'pending': return 'warning'
    case 'cancelled': return 'error'
    default: return 'grey'
  }
}

// Add function to get status tooltip
function getStatusTooltip(status) {
  switch (status) {
    case 'confirmed': return 'Appointment confirmed by doctor'
    case 'pending': return 'Waiting for doctor confirmation'
    case 'cancelled': return 'Appointment cancelled'
    default: return 'Unknown status'
  }
}

// Add function to format relative time
function getRelativeTime(date) {
  const now = new Date()
  const appointmentDate = new Date(date)
  const diffTime = appointmentDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Past appointment'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `In ${diffDays} days`
  return `In ${Math.ceil(diffDays/7)} weeks`
}

// Add this function to handle opening the notes dialog
function openNotesDialog(appointment) {
  selectedAppointment.value = appointment
  showNotesDialog.value = true
}

// Add function to fetch patient's profile
async function fetchPatientProfile() {
  try {
    const user = await getAuthUser()
    
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    
    patientProfile.value = data
  } catch (e) {
    console.error('Error fetching patient profile:', e)
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      fetchPatientProfile(),
      fetchDoctors(),
      fetchMyAppointments()
    ])
  } catch (e) {
    error.value = e.message
    console.error('Error during initialization:', e)
  }
})
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container>
        <v-row class="mb-6">
          <v-col cols="12" class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h4 mb-2">Hello, {{ patientProfile?.first_name || 'Patient' }}!</h1>
              <div class="text-subtitle-1 text-grey">Welcome to your appointments dashboard</div>
            </div>
            <v-btn
              color="error"
              @click="handleLogout"
              :loading="loading"
              prepend-icon="mdi-logout"
            >
              Logout
            </v-btn>
          </v-col>
        </v-row>

        <v-alert
          v-if="error"
          type="error"
          class="mb-4"
          closable
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>

        <!-- Doctor Selection -->
        <v-card class="mb-6">
          <v-card-title class="text-h5 pa-4">
            Available Doctors
          </v-card-title>
          
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="selectedDoctor"
                  :items="doctors"
                  item-title="fullName"
                  item-value="id"
                  label="Choose a Doctor"
                  @update:model-value="handleDoctorChange"
                  return-object
                  :hint="selectedDoctor ? `${selectedDoctor.specialty} - ${selectedDoctor.availableSlots} slots available` : 'Select a doctor to view available appointments'"
                  persistent-hint
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-avatar color="primary" size="32">
                          <span class="text-h6 text-white">{{ item.raw.first_name[0] }}</span>
                        </v-avatar>
                      </template>
                      <template v-slot:title>
                        <span class="font-weight-bold">{{ item.raw.fullName }}</span>
                      </template>
                      <template v-slot:subtitle>
                        <span>{{ item.raw.specialty }}</span>
                        <v-chip
                          class="ml-2"
                          color="primary"
                          size="x-small"
                          label
                        >
                          {{ item.raw.availableSlots }} slots
                        </v-chip>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-alert
          v-if="noAvailableDoctors"
          type="info"
          class="mb-6"
        >
          No doctors with available slots at the moment. Please check back later.
        </v-alert>

        <!-- Available Slots -->
        <v-card class="mb-6" v-if="selectedDoctor">
          <v-card-title class="text-h5 pa-4 d-flex align-center">
            <span>Available Appointments with {{ selectedDoctor.fullName }}</span>
            <v-chip class="ml-4" color="info" size="small">
              {{ selectedDoctor.specialty }}
            </v-chip>
          </v-card-title>
          
          <v-card-text>
            <v-data-table
              :headers="[
                { title: 'Date', key: 'date', align: 'start' },
                { title: 'Time', key: 'formattedTime', align: 'start' },
                { title: 'Duration', key: 'duration', align: 'start' },
                { title: 'Actions', key: 'actions', align: 'center' }
              ]"
              :items="availableSlots"
              :loading="loading"
              class="elevation-1"
            >
              <template v-slot:item.date="{ item }">
                {{ new Date(item.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) }}
              </template>

              <template v-slot:item.duration="{ item }">
                {{ item.duration }} minutes
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  color="primary"
                  size="small"
                  @click="bookAppointment(item)"
                  :loading="loading"
                >
                  Book Appointment
                </v-btn>
              </template>

              <template v-slot:no-data>
                <div class="text-center pa-4">
                  <v-icon icon="mdi-calendar-blank" size="large" color="grey" class="mb-2" />
                  <div class="text-grey">No available slots for this doctor</div>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- Add this before the My Appointments card -->
        <v-dialog v-model="showConfirmDialog" max-width="500px">
          <v-card>
            <v-card-title class="text-h5">Confirm Action</v-card-title>
            <v-card-text>
              Are you sure you want to {{ confirmDialogAction }} this appointment?
              <template v-if="confirmDialogItem">
                <div class="mt-4">
                  <strong>Date:</strong> {{ confirmDialogItem.formattedDate }}<br>
                  <strong>Time:</strong> {{ confirmDialogItem.formattedTime }}<br>
                  <strong>Doctor:</strong> {{ confirmDialogItem.doctorName }}
                </div>
              </template>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="grey-darken-1"
                variant="text"
                @click="showConfirmDialog = false"
              >
                Cancel
              </v-btn>
              <v-btn
                :color="confirmDialogAction === 'delete' ? 'error' : 'primary'"
                variant="text"
                @click="handleConfirmDialog"
                :loading="loading"
              >
                Confirm
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Update the My Appointments card -->
        <v-card>
          <v-card-title class="text-h5 pa-4 d-flex align-center">
            <span>My Appointments</span>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="searchQuery"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
              density="compact"
              class="ml-4"
              style="max-width: 200px"
            ></v-text-field>
            <v-select
              v-model="filterStatus"
              :items="[
                { title: 'All', value: 'all' },
                { title: 'Pending', value: 'pending' },
                { title: 'Confirmed', value: 'confirmed' },
                { title: 'Cancelled', value: 'cancelled' }
              ]"
              label="Status"
              density="compact"
              hide-details
              class="ml-4"
              style="max-width: 150px"
            ></v-select>
          </v-card-title>
          
          <v-card-text>
            <v-tabs v-model="tab">
              <v-tab value="active">Active Appointments</v-tab>
              <v-tab value="past">Past Appointments</v-tab>
            </v-tabs>

            <v-window v-model="tab">
              <v-window-item value="active">
            <v-data-table
              :headers="[
                    { 
                      title: 'Date & Time',
                      key: 'datetime',
                      align: 'start',
                      sortable: true
                    },
                    { 
                      title: 'Doctor',
                      key: 'doctorName',
                      align: 'start',
                      sortable: true
                    },
                    { 
                      title: 'Specialty',
                      key: 'specialty',
                      align: 'start'
                    },
                    { 
                      title: 'Status',
                      key: 'status',
                      align: 'start',
                      sortable: true
                    },
                    { 
                      title: 'When',
                      key: 'relative',
                      align: 'start'
                    },
                    { 
                      title: 'Actions',
                      key: 'actions',
                      align: 'center'
                    }
                  ]"
                  :items="activeAppointments"
              :loading="loading"
                  :items-per-page="itemsPerPage"
              class="elevation-1"
            >
                  <template v-slot:item.datetime="{ item }">
                    <div>{{ item.formattedDate }}</div>
                    <div class="text-caption">{{ item.formattedTime }}</div>
                  </template>

                  <template v-slot:item.relative="{ item }">
                    <div>{{ getRelativeTime(item.date) }}</div>
                  </template>

              <template v-slot:item.status="{ item }">
                    <v-tooltip :text="getStatusTooltip(item.status)">
                      <template v-slot:activator="{ props }">
                <v-chip
                          v-bind="props"
                          :color="getStatusColor(item.status)"
                  size="small"
                >
                  {{ item.status }}
                </v-chip>
                      </template>
                    </v-tooltip>
              </template>

              <template v-slot:item.actions="{ item }">
                    <div class="d-flex gap-2">
                      <v-btn
                        v-if="item.notes"
                        color="info"
                        size="small"
                        variant="tonal"
                        prepend-icon="mdi-note-text"
                        @click="openNotesDialog(item)"
                        class="mr-2"
                      >
                        View Notes
                      </v-btn>
                <v-btn
                  v-if="item.status !== 'cancelled'"
                  color="error"
                  size="small"
                        @click="handleCancelAppointment(item)"
                        :loading="loading"
                >
                  Cancel
                </v-btn>
                    </div>
                  </template>
                </v-data-table>
              </v-window-item>

              <v-window-item value="past">
                <v-data-table
                  :headers="[
                    { 
                      title: 'Date & Time',
                      key: 'datetime',
                      align: 'start',
                      sortable: true
                    },
                    { 
                      title: 'Doctor',
                      key: 'doctorName',
                      align: 'start',
                      sortable: true
                    },
                    { 
                      title: 'Specialty',
                      key: 'specialty',
                      align: 'start'
                    },
                    { 
                      title: 'Status',
                      key: 'status',
                      align: 'start'
                    },
                    { 
                      title: 'Notes',
                      key: 'notes',
                      align: 'start'
                    },
                    { 
                      title: 'Actions',
                      key: 'actions',
                      align: 'center'
                    }
                  ]"
                  :items="pastAppointments"
                  :loading="loading"
                  :items-per-page="itemsPerPage"
                  class="elevation-1"
                >
                  <template v-slot:item.datetime="{ item }">
                    <div>{{ item.formattedDate }}</div>
                    <div class="text-caption">{{ item.formattedTime }}</div>
                  </template>

                  <template v-slot:item.status="{ item }">
                    <v-tooltip :text="getStatusTooltip(item.status)">
                      <template v-slot:activator="{ props }">
                        <v-chip
                          v-bind="props"
                          :color="getStatusColor(item.status)"
                          size="small"
                        >
                          {{ item.status }}
                        </v-chip>
                      </template>
                    </v-tooltip>
                  </template>

                  <template v-slot:item.notes="{ item }">
                    <div v-if="item.notes" class="text-truncate" style="max-width: 200px;">
                      <v-tooltip :text="item.notes">
                        <template v-slot:activator="{ props }">
                          <span v-bind="props" class="text-caption">
                            {{ item.notes }}
                          </span>
                        </template>
                      </v-tooltip>
                    </div>
                    <span v-else class="text-caption text-disabled">No notes</span>
                  </template>

                  <template v-slot:item.actions="{ item }">
                    <div class="d-flex gap-2">
                      <v-btn
                        v-if="item.notes"
                        color="info"
                        size="small"
                        variant="tonal"
                        prepend-icon="mdi-note-text"
                        @click="openNotesDialog(item)"
                        class="mr-2"
                      >
                        View Notes
                      </v-btn>
                      <v-btn
                        v-if="item.status === 'cancelled'"
                        color="error"
                        size="small"
                        variant="outlined"
                        @click="handleDeleteAppointment(item)"
                        :loading="loading"
                      >
                        Delete
                      </v-btn>
                    </div>
              </template>
            </v-data-table>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>

        <!-- Doctor's Notes Dialog -->
        <v-dialog v-model="showNotesDialog" max-width="500">
          <v-card>
            <v-card-title class="text-h5 pa-4">
              <v-icon icon="mdi-note-text" class="mr-2" color="primary"></v-icon>
              Doctor's Notes
            </v-card-title>
            
            <v-card-text>
              <div v-if="selectedAppointment" class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon icon="mdi-calendar" class="mr-2" color="primary"></v-icon>
                  <strong>Appointment:</strong>
                  <span class="ml-2">{{ selectedAppointment.formattedDate }}</span>
                </div>
                <div class="d-flex align-center mb-2">
                  <v-icon icon="mdi-clock" class="mr-2" color="primary"></v-icon>
                  <strong>Time:</strong>
                  <span class="ml-2">{{ selectedAppointment.formattedTime }}</span>
                </div>
                <div class="d-flex align-center mb-4">
                  <v-icon icon="mdi-doctor" class="mr-2" color="primary"></v-icon>
                  <strong>Doctor:</strong>
                  <span class="ml-2">{{ selectedAppointment.doctorName }}</span>
                </div>
                
                <v-divider class="mb-4"></v-divider>
                
                <div class="notes-content pa-4 bg-grey-lighten-4 rounded-lg">
                  <div class="d-flex align-center mb-2">
                    <v-icon icon="mdi-note-text" class="mr-2" color="primary"></v-icon>
                    <strong>Notes from your doctor:</strong>
                  </div>
                  <p class="text-body-1 mt-2" style="white-space: pre-line">
                    {{ selectedAppointment.notes || 'No additional notes from the doctor.' }}
                  </p>
                </div>
              </div>
            </v-card-text>
            
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                variant="text"
                @click="showNotesDialog = false"
              >
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </template>
  </AppLayout>
</template>

<style scoped>
.v-card {
  margin-bottom: 20px;
}

.text-h4 {
  color: #1976d2;
  font-weight: 600;
}

.text-h5 {
  color: #1976d2;
  font-weight: 500;
}

.v-data-table {
  background-color: white;
}

.doctor-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.doctor-card:hover {
  transform: translateY(-2px);
}

.selected-doctor {
  border: 2px solid #1976d2;
}

.v-avatar {
  margin-right: 8px;
}

.specialty-chip {
  margin-left: 8px;
}

.gap-2 {
  gap: 8px;
}

/* Add styles for action buttons */
.d-flex.gap-2 {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.v-btn.v-btn--size-small {
  min-width: 80px;
}

/* Add styles for the new features */
.v-data-table .text-caption {
  color: rgba(0, 0, 0, 0.6);
}

.v-card-title .v-text-field {
  max-width: 200px;
}

.v-card-title .v-select {
  max-width: 150px;
}

.v-tabs {
  margin-bottom: 16px;
}

.v-window {
  margin-top: 16px;
}

.v-tooltip {
  display: inline-block;
}

.v-dialog .mt-4 {
  margin-top: 16px;
}

/* Add responsive styles */
@media (max-width: 600px) {
  .v-card-title {
    flex-direction: column;
    align-items: stretch;
  }

  .v-card-title .v-text-field,
  .v-card-title .v-select {
    max-width: 100%;
    margin-left: 0;
    margin-top: 8px;
  }
}

.notes-content {
  border-left: 4px solid #1976d2;
}

.v-icon {
  opacity: 0.9;
}

/* Add a subtle animation for the notes button */
.v-btn.v-btn--size-small {
  transition: all 0.2s ease;
}

.v-btn.v-btn--size-small:hover {
  transform: translateY(-1px);
}

/* Add a notification dot for appointments with notes */
.has-notes {
  position: relative;
}

.has-notes::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: #1976d2;
  border-radius: 50%;
  border: 2px solid white;
}

/* Responsive Layout */
.v-container {
  max-width: 100%;
  padding: 16px;
}

/* Analytics Cards */
.analytics-card {
  height: 100%;
  min-height: 120px;
  transition: all 0.3s ease;
}

/* Doctor Selection */
.doctor-select-card {
  margin-bottom: 1rem;
}

/* Table Responsiveness */
.responsive-table {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1rem;
  border-radius: 8px;
}

.v-data-table {
  width: 100%;
  min-width: 600px; /* Minimum width before horizontal scroll */
}

/* Card Layouts */
.v-card {
  width: 100%;
  margin-bottom: 1rem;
}

/* Dialog Responsiveness */
.v-dialog {
  margin: 16px;
  width: calc(100% - 32px) !important;
  max-width: 500px !important;
}

/* Search and Filter Controls */
.controls-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1rem;
}

.search-field {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  min-width: 150px;
}

/* Responsive Grid */
.responsive-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

/* Button Groups */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Responsive Typography */
@media (max-width: 600px) {
  .text-h4 {
    font-size: 1.5rem !important;
  }
  
  .text-h5 {
    font-size: 1.25rem !important;
  }
  
  .text-subtitle-1 {
    font-size: 0.875rem !important;
  }
}

/* Tablet Adjustments */
@media (max-width: 960px) {
  .v-col {
    padding: 8px;
  }

  .controls-wrapper {
    flex-direction: column;
  }

  .search-field,
  .filter-select {
    width: 100%;
  }
}

/* Mobile Adjustments */
@media (max-width: 600px) {
  .v-container {
    padding: 8px;
  }

  .v-card-title {
    font-size: 1.25rem;
    padding: 16px;
  }

  .v-card-text {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .v-btn {
    width: 100%;
  }
}

/* Landscape Mode */
@media (max-height: 600px) and (orientation: landscape) {
  .v-container {
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .v-dialog {
    max-height: 90vh;
    overflow-y: auto;
  }
}

/* High DPI Screens */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .v-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

/* Print Styles */
@media print {
  .v-btn,
  .v-dialog,
  .action-buttons {
    display: none !important;
  }

  .v-card {
    box-shadow: none !important;
    border: 1px solid #ddd;
  }
}

/* Utility Classes */
.flex-grow {
  flex-grow: 1;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: white;
}

/* Animation Classes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .v-card {
    background-color: #1E1E1E;
  }

  .text-medium-emphasis {
    color: rgba(255, 255, 255, 0.7) !important;
  }
}

/* Touch Device Optimizations */
@media (hover: none) {
  .v-btn:hover {
    transform: none !important;
  }

  .v-card:hover {
    transform: none !important;
  }
}
</style> 