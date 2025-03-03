<template>
  <VueDraggable
    :model-value="tabs"
    :group="{
      name: 'aside-card',
      put: false,
      pull: onPull,
    }"
    item-key="id"
    class="aside-card-wrapper flex flex-col gap-3"
    ghost-class="sortable-ghost-dashed-border"
    @end="onDragEnd"
  >
    <template v-if="tabs.length">
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
    </template>
    <template v-else>
      <div class="text-center text-text-secondary">No tabs</div>
    </template>
  </VueDraggable>
</template>

<script setup lang="ts">
import { isNewTabPage } from "@/utils"
import { VueDraggable, SortableEvent } from "vue-draggable-plus"
import type Sortable from "sortablejs"
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

const onPull = (
  _to: Sortable,
  _from: Sortable,
  dragEl: HTMLElement,
  _event: SortableEvent,
): "clone" | boolean => {
  if (dragEl.classList.contains("card-wrapper")) {
    return "clone"
  }
  return true
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
</style>
