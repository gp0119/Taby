<template>
  <div class="flex h-full bg-body-color">
    <pinSide
      :mode="layoutStore.leftLayoutMode"
      :hovering="layoutStore.leftLayoutHovering"
      side="left"
      @update:hovering="layoutStore.onUpdateLayoutHovering($event, 'left')"
    >
      <left-aside />
      <template #footer>
        <LeftActions />
      </template>
    </pinSide>
    <main
      class="flex-1 rounded-xl bg-content-color"
      :style="{
        marginLeft:
          layoutStore.leftLayoutMode === 'collapse' ||
          layoutStore.leftLayoutMode === 'hover'
            ? '60px'
            : '220px',
        marginRight:
          layoutStore.rightLayoutMode === 'collapse' ||
          layoutStore.rightLayoutMode === 'hover'
            ? '60px'
            : '220px',
      }"
    >
      <navs />
      <content />
    </main>
    <pinSide
      :mode="layoutStore.rightLayoutMode"
      :hovering="layoutStore.rightLayoutHovering"
      side="right"
      @update:hovering="layoutStore.onUpdateLayoutHovering($event, 'right')"
    >
      <right-aside />
    </pinSide>
    <UploadBtn />
  </div>
</template>

<script setup lang="ts">
import pinSide from "@/components/pin-side.vue"
import navs from "@/views/navs/navs.vue"
import leftAside from "@/views/left-aside/left-aside.vue"
import rightAside from "@/views/right-aside/index.vue"
import content from "@/views/content/index.vue"
import { useLayoutStore } from "@/store/layout"
import LeftActions from "@/views/left-aside/components/left-actions.vue"
import UploadBtn from "@/components/upload-btn.vue"

const layoutStore = useLayoutStore()
</script>
