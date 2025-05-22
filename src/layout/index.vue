<template>
  <div class="flex h-full bg-[#E0E4E8]">
    <pinSide
      :collapsed="layoutStore.leftAsideCollapsed"
      :pinned="layoutStore.leftAsidePinned"
      side="left"
      @update:collapsed="layoutStore.onUpdateLeftAsideCollapsed"
    >
      <left-aside />
      <template #footer>
        <LeftActions />
      </template>
    </pinSide>
    <main class="flex-1 rounded-xl bg-content-bg">
      <navs />
      <content />
    </main>
    <pinSide
      :collapsed="layoutStore.rightAsideCollapsed"
      :pinned="layoutStore.rightAsidePinned"
      side="right"
      @update:collapsed="layoutStore.onUpdateRightAsideCollapsed"
    >
      <right-aside />
    </pinSide>
  </div>
</template>

<script setup lang="ts">
import pinSide from "@/components/pin-side.vue"
import navs from "@/views/navs/navs.vue"
import leftAside from "@/views/left-aside/left-aside.vue"
import rightAside from "@/views/right-aside/index.vue"
import content from "@/views/content/index.vue"
import { useLayoutStore } from "@/store/layout"
import LeftActions from "@/components/left-actions.vue"

const layoutStore = useLayoutStore()
</script>
