<template>
  <VueDraggable
    :model-value="tabs"
    :group="{
      name: 'aside-card',
      put: false,
      pull: 'clone',
    }"
    item-key="id"
    class="aside-card-wrapper flex flex-col gap-3"
    ghost-class="sortable-ghost-dashed-border"
    @end="onDragEnd"
  >
    <card
      v-for="(tab, index) in tabs"
      :key="tab.id"
      :data-id="tab.id"
      :data-windowid="windowId"
      :data-url="tab.url"
      :data-title="tab.title"
      :data-index="index"
      class="group/aside right-aside-item"
      type="right-aside"
      :class="{ hidden: isNewTabPage(tab.url) }"
      :child="tab"
      @delete="removeTab(tab.id)"
      @click="activeTab(tab)"
    />
  </VueDraggable>
</template>

<script setup lang="ts">
import { isNewTabPage } from "@/utils"
import { VueDraggable, SortableEvent } from "vue-draggable-plus"
import type { Card as iCard } from "@/type.ts"
import card from "@components/card.vue"

defineProps<{
  tabs: any[]
  windowId: string | number
}>()

const emit = defineEmits<{
  (e: "removeTab", id: number | undefined): void
  (e: "activeTab", tab: iCard): void
  (e: "dragEnd", event: SortableEvent): void
  (e: "move", event: SortableEvent): boolean | void | 1 | -1
}>()

const removeTab = (id: string) => {
  emit("removeTab", Number(id))
}

const activeTab = (tab: iCard) => {
  emit("activeTab", tab)
}

const onDragEnd = (e: SortableEvent) => {
  emit("dragEnd", e)
}
</script>
<style scoped>
.aside-card-wrapper :deep(.card-size) {
  height: 20px;
  width: 20px;
}
.aside-card-wrapper :deep(.card-header) {
  padding: 8px;
}
.aside-card-wrapper :deep(.card-title) {
  font-weight: 400;
}
.aside-card-wrapper :deep(.delete-button) {
  top: 10px;
}
.aside-card-wrapper :deep(.card-title-wrapper) {
  display: none;
}
.aside-card-wrapper :deep(.checkbox) {
  display: none !important;
}
.aside-card-wrapper :deep(.favicon) {
  display: block !important;
}
</style>
