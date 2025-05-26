<template>
  <TopAction v-model:show="show" @close="onCancel">
    <div
      class="flex-center select-none gap-x-3 font-medium text-text-secondary"
    >
      {{ ft("drag-mode") }}
    </div>
  </TopAction>
</template>

<script setup lang="ts">
import TopAction from "@/components/top-action.vue"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useDraggableStore } from "@/store/draggable.js"

const { ft } = useHelpi18n()
const show = ref(false)

const draggableStore = useDraggableStore()
function onCancel() {
  draggableStore.setDraggable(false)
}

watch(
  () => draggableStore.draggable,
  (value) => {
    show.value = value
  },
)
</script>
