<template>
  <n-popover trigger="click" placement="bottom" :show-arrow="false">
    <template #trigger>
      <n-icon
        size="20"
        title="Tag"
        :component="TagGroup"
        class="mx-1.5 cursor-pointer text-primary"
      />
    </template>
    <div class="!bg-body-color">1111</div>
  </n-popover>
</template>

<script setup lang="ts">
import { TagGroup } from "@vicons/carbon"
import { useTagsStore } from "@/store/tags"

const tagsStore = useTagsStore()

onMounted(async () => {
  await tagsStore.fetchTags()
})
</script>

<style scoped></style>
