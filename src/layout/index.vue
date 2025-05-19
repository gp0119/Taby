<template>
  <div class="flex">
    <pinSide :collapsed="leftAsideCollapsed" side="left">
      <left-aside />
    </pinSide>
    <main class="flex-1">
      <navs />
      <content />
    </main>
    <pinSide :collapsed="rightAsideCollapsed" side="right">
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

const leftAsideCollapsed = ref(true)
const rightAsideCollapsed = ref(true)
</script>
