<template>
  <VueDraggable
    :model-value="tabs"
    :group="{
      name: 'aside-card',
      put: ['aside-card'],
      pull: 'clone',
    }"
    item-key="id"
    :data-windowid="windowId"
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
      :select-ids="selectedTabIds"
      class="group/aside right-aside-item"
      type="right-aside"
      :class="{ hidden: isNewTabPage(tab.url) }"
      :child="tab"
      @delete="removeTab(tab.id)"
      @click="activeTab(tab)"
      @check="onHandleCheckbox($event, tab)"
      :show-checkbox="showCheckbox"
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
  selectedTabIds: number[]
  showCheckbox: boolean
}>()

const emit = defineEmits<{
  (e: "removeTab", id: number | undefined): void
  (e: "activeTab", tab: iCard): void
  (e: "dragEnd", event: SortableEvent): void
  (e: "check", value: boolean, tab: iCard): void
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

const onHandleCheckbox = (value: boolean, tab: iCard) => {
  emit("check", value, tab)
}
</script>
<style scoped>
.aside-card-wrapper :deep(.favicon-size) {
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
