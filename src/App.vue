<template>
  <v-app>
    <Suspense>
      <template #default>
        <router-view />
      </template>
      <template #fallback>
        <div style="text-align: center; padding: 2rem">
          <v-progress-circular indeterminate color="primary" size="48" />
          <div>Loading...</div>
        </div>
      </template>
    </Suspense>
  </v-app>
</template>

<script setup>
// No setup needed for basic routing
</script>
