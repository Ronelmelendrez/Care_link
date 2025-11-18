<template>
  <AppLayout>
    <template #content>
      <v-container>
        <!-- App Bar with Hamburger Menu -->
        <v-row justify="end" align="center" class="mb-6">
          <v-col cols="auto">
            <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
          </v-col>
        </v-row>

        <!-- Right-Side Drawer -->
        <v-navigation-drawer
          v-model="drawer"
          app
          temporary
          right
        >
          <v-list>
            <!-- Home Option -->
            <v-list-item @click="navigateTo('home')">
              <v-list-item-icon>
                <v-icon>mdi-home</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Home</v-list-item-title>
            </v-list-item>

            <!-- Profile Option -->
            <v-list-item @click="navigateTo('profile')">
              <v-list-item-icon>
                <v-icon>mdi-account</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>

            <!-- Clinics Option -->
            <v-list-item @click="navigateTo('clinics')">
              <v-list-item-icon>
                <v-icon>mdi-hospital</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Clinics</v-list-item-title>
            </v-list-item>

            <!-- Logout Option -->
            <v-list-item @click="handleLogout">
              <v-list-item-icon>
                <v-icon>mdi-logout</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Log Out</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>

        <!-- Available Clinics Section -->
        <v-card class="pa-4 userinfo" v-if="user">
          <v-card-title class="user">You are successfully logged in!</v-card-title>
          <v-card-text>
            <p class=" user1">Email: {{ user.email }}</p>
            <p class="user1">
              Last Sign In: {{ new Date(user.last_sign_in_at).toLocaleString() }}
            </p>
          </v-card-text>
        </v-card>
        <br />
        <h1>Available Clinics</h1>
        <p class="mb-1">Click to book an appointment</p>

        <v-row class="gap-4">
          <!-- General Health Clinic -->
          <v-col cols="auto">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn class="available" v-bind="props" style="height: 58px;">
                  General Health<br />
                  Availability: Monday-Friday <br />
                  Slots left:
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="(item, index) in generalHealthItems"
                  :key="index"
                  :value="index"
                  @click="navigateToStaffDashboard(item.title)"
                >
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>

          <!-- Dental Clinic -->
          <v-col cols="auto">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn class="available" v-bind="props" style="height: 58px;">
                  Dental<br />
                  Availability: Monday-Friday <br />
                  Slots left:
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="(item, index) in dentalItems"
                  :key="index"
                  :value="index"
                  @click="navigateToStaffDashboard(item.title)"
                >
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
      </v-container>

      <br>
      <h1 class="mt-3 services text-center">Our Services</h1>
      <br>
      <h3 class="gentitle">General Health Clinic</h3>
<v-row>
  <v-col cols="12" md="4">
    <v-card class="genhealth">
      <v-card-item>
        <v-icon color="primary" large>mdi-hospital-box</v-icon>
        <v-card-title>Health</v-card-title>
      </v-card-item>
      <v-card-subtitle>tempo</v-card-subtitle>
      <v-card-text>
        Receive comprehensive care and guidance for your overall well-being. Our health clinic is dedicated to addressing general health concerns and promoting a healthier campus life.
      </v-card-text>
    </v-card>
  </v-col>

  <v-col cols="12" md="4">
    <v-card class="firstaid">
      <v-card-item>
        <v-icon color="primary" large>mdi-medical-bag</v-icon>
        <v-card-title>First-Aid</v-card-title>
      </v-card-item>
      <v-card-subtitle>tempo</v-card-subtitle>
      <v-card-text>
        Quick and reliable assistance for minor injuries and emergencies. Our first-aid services ensure you're cared for promptly in urgent situations.
      </v-card-text>
    </v-card>
  </v-col>

  <v-col cols="12" md="4">
    <v-card class="pres">
      <v-card-item>
        <v-icon color="primary" large>mdi-pill</v-icon>
        <v-card-title>Mental Health</v-card-title>
      </v-card-item>
      <v-card-subtitle>tempo</v-card-subtitle>
      <v-card-text>
        Fostering the emotional and psychological well-being of students and staff. We understand the challenges of academic life and aim to provide a safe, supportive environment to address mental health concerns.
      </v-card-text>
    </v-card>
  </v-col>
</v-row>

<h3 class="dentitle">Dental Clinic</h3>
<v-row>
  <v-col cols="12" md="4">
    <v-card class="teethcleaning">
      <v-card-item>
        <v-icon color="primary" large>mdi-tooth</v-icon>
        <v-card-title>Teeth Cleaning</v-card-title>
      </v-card-item>
      <v-card-subtitle>tempo</v-card-subtitle>
      <v-card-text>
        Keep your smile bright and healthy with professional teeth cleaning services. Maintain your oral hygiene with care from our dental experts.
      </v-card-text>
    </v-card>
  </v-col>

  <v-col cols="12" md="4">
    <v-card class="dental">
      <v-card-item>
        <v-icon color="primary" large>mdi-tooth-outline</v-icon>
        <v-card-title>Dental Exams</v-card-title>
      </v-card-item>
      <v-card-subtitle>tempo</v-card-subtitle>
      <v-card-text>
        Regular dental exams to check your oral health, prevent issues, and address any concerns. Ensuring your dental health is our priority.
      </v-card-text>
    </v-card>
  </v-col>
</v-row>
<br>
<br>
<div class="container-fluid grey-background">
<!-- Updated Section: Resized Images and Aligned Names -->
<h1 class="text-center specialist mt-4" style="color: black;">Our Specialists</h1>
<br>
<v-row>
  <v-col cols="12" md="6">
    <!-- Left Column: Images and Names -->
    <v-row align="center">
      <v-col cols="12" class="mb-4 d-flex">
        <v-img 
          src="src/assets/i1.jpg" 
         width="100" 
          contain 
          class="mr-4"
        ></v-img>
        <div>
          <h4 class="mb-1"> Dr. James Wilson (Health Doctor)</h4>
          <p>10 years of experience in general health care and promoting overall well-being.</p>
        </div>
      </v-col>
      
      <v-col cols="12" class="mb-4 d-flex align-center">
        <v-img 
        src="src/assets/i2.jpg" 
        width="100" 
          contain 
          class="mr-4"
        ></v-img>
        <div>
          <h4 class="mb-1">Dr. Sarah Thompson (First-aid Specialist)</h4>
          <p>8 years of experience providing prompt assistance for injuries and emergencies.</p>
        </div>
      </v-col>
      
      <v-col cols="12" class="mb-4 d-flex align-center">
        <v-img 
        src="src/assets/i3.jpg" 
        width="100" 
          contain 
          class="mr-4"
        ></v-img>
        <div>
          <h4 class="mb-1">Dr. Kate Anderson (Mental Health Specialist)</h4>
          <p>7 years of experience handling prescriptions and ensuring easy access to medications.</p>
        </div>
      </v-col>
      
      <v-col cols="12" class="mb-4 d-flex align-center">
        <v-img 
        src="src/assets/i4.jpg" 
        width="100" 
          contain 
          class="mr-4"
        ></v-img>
        <div>
          <h4 class="mb-1">Dr. Daniel Clark (Dentist)</h4>
          <p>12 years of experience specializing in dental care, including cleaning and exams.</p>
        </div>
      </v-col>
    </v-row>
  </v-col>
</v-row>
</div>

  <br>
  <br>
  <h2 class="about text-center mt-5">About Us</h2>
  <br>
  <p class="about1">Our platform is designed to connect students and staff with the university's healthcare services effortlessly. From booking general health consultations to dental exams, we aim to provide a seamless and efficient way to access quality care right on campus. Your health and convenience are our priority.</p>

    </template>
  </AppLayout>
</template>

<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
import { onMounted, ref } from "vue";
import { supabase } from "@/supabase";
import { useRouter } from "vue-router";

const drawer = ref(false); 
const router = useRouter();
const user = ref(null);
const loading = ref(false);

const generalHealthItems = ref([
  { title: "Health Clinics" },
  { title: "First Aid" },
  { title: "Prescriptions and Pharmacy" },
]);

const dentalItems = ref([
  { title: "Teeth Cleaning" },
  { title: "Dental Exams" },
]);

onMounted(async () => {
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    router.push("/");
    return;
  }
  user.value = currentUser;
});

function navigateToStaffDashboard(itemTitle) {
  console.log(`Navigating to staff dashboard with item: ${itemTitle}`);
  router.push({ name: "staff-dashboard", query: { item: itemTitle } });
}

function navigateTo(routeName) {
  drawer.value = false;
  router.push({ name: routeName });
}

async function handleLogout() {
  try {
    loading.value = true;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    router.push("/");
  } catch (e) {
    console.error("Error logging out:", e.message);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.userinfo {
  height: 105px;
}
.user{
  font-size: 18px;
}
.user1{
  font-size: 15px;
}
.available{
  background: #34c759;
}
/* Glass Style for Cards */

.genhealth, .firstaid, .pres, 
.teethcleaning, .dental {
  border: 2px solid rgba(255, 255, 255, 0.2); 
  border-radius: 15px; 
  background: rgba(255, 255, 255, 0.2); 
  backdrop-filter: blur(10px); 
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25); 
  transition: all 0.3s ease; 
  cursor: pointer;
}

.genhealth:hover, 
.dental:hover, 
.teethcleaning:hover, 
.firstaid:hover, 
.pres:hover {
  border-color: #4daf50; 
  transform: scale(1.05); 
}

/* General Layout */

.gentitle, .dentitle {
  text-align: left;
  margin-bottom: 20px;
  color: black;
}
/* Style for the grey background in "Our Specialists" section */
.grey-background {
  background-color: rgba(24, 112, 6, 0.6); 
  backdrop-filter: blur(8px); 
  padding: 20px; 
  margin-top: 20px; 
  border-radius: 10px; 
  color: white; 
}

/* Buttons - Glass Style */
v-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(8px) !important;
  color: #fff !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
  text-transform: capitalize !important;
}

/* Navigation Drawer */
v-navigation-drawer {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

/* Text Customization */
h3 {
  color: #fff;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5);
}
</style>
