<template>
  <div class="taby-layout flex h-full bg-body-color">
    <button
      v-if="mobileAsideOpen"
      type="button"
      class="mobile-aside-mask"
      aria-label="Close spaces menu"
      @click="closeMobileAside"
    />
    <pinSide
      class="mobile-left-aside"
      :class="{ 'mobile-aside-open': mobileAsideOpen }"
      :inert="isMobileLayout && !mobileAsideOpen"
      :aria-hidden="isMobileLayout && !mobileAsideOpen"
      :mode="isMobileLayout ? 'expand' : layoutStore.leftLayoutMode"
      :hovering="layoutStore.leftLayoutHovering"
      side="left"
      @click="closeMobileAside"
      @keydown.esc="closeMobileAside"
      @update:hovering="layoutStore.onUpdateLayoutHovering($event, 'left')"
    >
      <left-aside />
      <template #footer>
        <LeftActions />
      </template>
    </pinSide>
    <main
      class="taby-main min-w-0 flex-1 rounded-xl bg-content-color"
      :style="{
        marginLeft:
          layoutStore.leftLayoutMode === 'collapse' ||
          layoutStore.leftLayoutMode === 'hover'
            ? '60px'
            : '220px',
        marginRight: isWeb
          ? '0'
          : layoutStore.rightLayoutMode === 'collapse' ||
              layoutStore.rightLayoutMode === 'hover'
            ? '60px'
            : '220px',
      }"
    >
      <navs @open-mobile-aside="openMobileAside" />
      <content />
    </main>
    <pinSide
      v-if="!isWeb"
      :mode="layoutStore.rightLayoutMode"
      :hovering="layoutStore.rightLayoutHovering"
      side="right"
      @update:hovering="layoutStore.onUpdateLayoutHovering($event, 'right')"
    >
      <right-aside />
    </pinSide>
    <UploadBtn />
    <SyncConflictHandler />
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
import SyncConflictHandler from "@/components/sync-conflict-handler"
import { isWeb } from "@/utils/platform"
import { useMediaQuery } from "@vueuse/core"

const layoutStore = useLayoutStore()
const mobileAsideOpen = ref(false)
const mobileLayoutQuery = useMediaQuery("(max-width: 999px)")
const isMobileLayout = computed(() => isWeb && mobileLayoutQuery.value)

function openMobileAside() {
  mobileAsideOpen.value = true
  nextTick(() =>
    document
      .querySelector<HTMLElement>(
        ".mobile-left-aside a, .mobile-left-aside button",
      )
      ?.focus(),
  )
}

function closeMobileAside() {
  if (!mobileAsideOpen.value) return
  mobileAsideOpen.value = false
  nextTick(() =>
    document.querySelector<HTMLElement>(".mobile-menu-button")?.focus(),
  )
}
</script>
