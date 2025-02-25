<template>
  <n-avatar
    :img-props="{
      crossorigin: 'anonymous',
    }"
    :src="innerFavicon"
    class="card-avatar card-size"
  >
    <template #fallback>
      <div class="card-size flex-center bg-hover-color">
        <span class="text-text-primary">{{ firstLetter }}</span>
      </div>
    </template>
  </n-avatar>
</template>

<script setup lang="ts">
import { Card } from "@/type.ts"
import { getFaviconFromCache, getGoogleFavicon } from "@/utils"

const props = defineProps<{
  type: string
  child: Card
}>()

const firstLetter = props.child.title?.charAt(0).toUpperCase()

const innerFavicon = computed(() => {
  const { favicon, url } = props.child
  if (props.type === "right-aside") {
    return getFaviconFromCache(url) || getGoogleFavicon(url)
  }
  return favicon ? favicon : getGoogleFavicon(url)
})
</script>

<style scoped>
.card-avatar {
  @apply mr-2.5 flex-shrink-0 bg-white sepia-base;
}
.card-size {
  @apply group-[.drag-item]/content:h-[24px] group-[.drag-item]/content:w-[24px];
  @apply group-[.right-aside-item]/aside:h-[20px] group-[.right-aside-item]/aside:w-[20px];
}
</style>
