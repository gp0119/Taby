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
    <template #fallback>
      <div class="favicon-size flex-center h-full bg-hover-color">
        <span class="text-text-primary">{{ firstLetter }}</span>
      </div>
    </template>
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
import { CardWithFavicon } from "@/type.ts"
import { getFaviconFromCache, getGoogleFavicon } from "@/utils"
import { DocumentUnknown } from "@vicons/carbon"

const props = defineProps<{
  type: string
  child: CardWithFavicon
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
  @apply mr-2.5 inline-block flex-shrink-0 select-none bg-transparent sepia-base;
}
</style>
