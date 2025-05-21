<template>
  <VueDraggable
    :model-value="spaces"
    item-key="id"
    class="flex flex-col gap-y-1.5"
    ghost-class="sortable-ghost-dashed-border"
    @end="onDragEnd"
  >
    <div
      v-for="item in spaces"
      :key="item.title"
      class="space-item flex w-full cursor-pointer flex-nowrap items-center gap-x-2.5 whitespace-nowrap rounded-lg p-2 font-medium text-text-primary hover:shadow-hover-shadow"
      :data-id="item.id"
      :class="{ '!font-bold !text-primary': activeSpaceId === item.id }"
      @click="onHandleSpaceClick(item)"
    >
      <n-button
        :tertiary="activeSpaceId !== item.id"
        :secondary="activeSpaceId === item.id"
        size="small"
        :type="activeSpaceId === item.id ? 'primary' : 'default'"
        class="w-[28px] flex-shrink-0 !shadow-btn-shadow"
      >
        <template #icon>
          <n-icon
            size="18"
            :component="item.icon ? ICON_LIST[item.icon] : StorefrontOutline"
          />
        </template>
      </n-button>
      <div
        class="select-none overflow-hidden"
        :class="{
          'animate-hide': layoutStore.leftAsideCollapsed,
          'animate-show': !layoutStore.leftAsideCollapsed,
        }"
      >
        {{ item.title }}
      </div>
    </div>
  </VueDraggable>
</template>

<script setup lang="ts">
import { VueDraggable, SortableEvent } from "vue-draggable-plus"
import { Space } from "@/type.ts"
import { ICON_LIST } from "@/utils/constants.ts"
import { StorefrontOutline } from "@vicons/ionicons5"
import { useLayoutStore } from "@/store/layout"

const layoutStore = useLayoutStore()

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
