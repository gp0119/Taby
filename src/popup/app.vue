<template>
  <div class="w-80 rounded-lg bg-white p-4">
    <h1>Taby</h1>
  </div>
</template>

<script setup lang="ts">
import dataManager from "@/db"
import { Space } from "@/type.ts"

const spaces = ref<Space[]>([])
onMounted(async () => {
  spaces.value = await dataManager.getAllSpaces()
  console.log("spaces: ", spaces)
})
</script>
