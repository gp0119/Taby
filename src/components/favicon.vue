<template>
  <n-avatar
    :img-props="{
      crossorigin: 'anonymous',
      referrerpolicy: 'no-referrer',
    }"
    :src="innerFavicon"
    lazy
    class="card-avatar favicon-size"
  >
    <template #placeholder>
      <div class="favicon-size flex-center h-full">
        <n-icon
          class="text-text-secondary"
          size="24"
          :component="DocumentUnknown"
        />
      </div>
    </template>
  </n-avatar>
</template>

<script setup lang="tsx">
import { Card } from "@/type.ts"
import { getGoogleFavicon, getFaviconFromCache, getWsrvFavicon } from "@/utils"
import { DocumentUnknown } from "@vicons/carbon"

const props = defineProps<{
  child: Card
}>()

const innerFavicon = computed(() => {
  const { favicon, url } = props.child
  return favicon
    ? favicon.startsWith("http")
      ? getWsrvFavicon(favicon)
      : favicon
    : url.startsWith("chrome://")
      ? getFaviconFromCache(url)
      : getGoogleFavicon(url)
})
</script>

<style scoped>
.card-avatar {
  @apply mr-2.5 inline-block flex-shrink-0 select-none bg-transparent sepia-base;
}
</style>
