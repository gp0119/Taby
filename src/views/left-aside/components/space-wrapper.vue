<template>
  <VueDraggable
    :model-value="spaces"
    item-key="id"
    class="flex flex-col"
    ghost-class="sortable-ghost-dashed-border"
    @end="onDragEnd"
  >
    <div
      class="space-item flex cursor-pointer items-center px-2 py-1.5 font-medium text-text-primary"
      v-for="item in spaces"
      :data-id="item.id"
      :class="{ '!font-bold !text-primary': activeSpaceId === item.id }"
      :key="item.title"
      @click="onHandleSpaceClick(item)"
    >
      <n-icon size="18">
        <component :is="item.icon ? ICON_LIST[item.icon] : StorefrontOutline" />
      </n-icon>
      <span class="select-none px-1">{{ item.title }}</span>
    </div>
  </VueDraggable>
</template>

<script setup lang="ts">
import { VueDraggable, SortableEvent } from "vue-draggable-plus"
import { Space } from "@/type.ts"
import { ICON_LIST } from "@/utils/constants.ts"
import { StorefrontOutline } from "@vicons/ionicons5"

defineProps<{
  spaces: Space[]
  activeSpaceId: number
}>()

const emit = defineEmits<{
  (e: "click", tab: Space): void
  (e: "dragEnd", event: SortableEvent): void
}>()

const onDragEnd = (e: SortableEvent) => {
  emit("dragEnd", e)
}

const onHandleSpaceClick = (item: Space) => {
  emit("click", item)
}
</script>
