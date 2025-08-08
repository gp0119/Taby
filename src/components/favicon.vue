<template>
  <n-avatar
    :src="innerFavicon"
    :lazy="lazyload"
    class="card-avatar favicon h-5 w-5"
    :intersection-observer-options="
      lazyload ? { root: props.containerClass } : undefined
    "
  >
    <template #placeholder>
      <div class="flex-center favicon h-5 w-5">
        <n-icon
          class="text-text-secondary"
          size="18"
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

const props = withDefaults(
  defineProps<{
    child: Card
    containerClass?: string
    lazyload?: boolean
  }>(),
  {
    lazyload: true,
  },
)

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
  @apply inline-block flex-shrink-0 select-none bg-transparent;
}
</style>
