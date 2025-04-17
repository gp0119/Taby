<template>
  <NDialogProvider>
    <NMessageProvider>
      <Popup />
    </NMessageProvider>
  </NDialogProvider>
</template>

<script setup lang="ts">
import Popup from "./popup.vue"
</script>
