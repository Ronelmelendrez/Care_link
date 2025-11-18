<template>
  <div class="app-layout">
    <slot name="content"></slot>
  </div>
</template>

<script setup>
// No setup needed for basic layout
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  padding: 20px;
}
</style>