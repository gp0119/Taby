<template>
  <TopAction v-model:show="show" @close="onCancel">
    <div
      v-if="duplicateCardStore.duplicateCards.size > 0"
      class="flex-center select-none gap-x-3 font-medium text-text-secondary"
    >
      <span>
        {{ t("current-duplicate-count-prefix") }}
        <span class="mx-1 font-medium text-primary">
          {{ duplicateCardStore.currentDuplicateCount }}
        </span>
        {{ t("current-duplicate-count-suffix") }}
      </span>
      <span class="h-[16px] w-[0.5px] bg-text-secondary" />
      <span class="font-medium">
        {{ duplicateCardStore.currentIndex + 1 }}
        /
        {{ duplicateCardStore.duplicateCards.size }}
      </span>
    </div>
    <div
      v-if="duplicateCardStore.duplicateCards.size > 0"
      class="flex items-center justify-between gap-x-4"
    >
      <n-button
        tertiary
        size="small"
        :disabled="duplicateCardStore.currentIndex === 0"
        @click="showPrevious"
      >
        <template #icon>
          <n-icon :size="16" :component="PreviousOutline" />
        </template>
        {{ ft("previous") }}
      </n-button>
      <n-button
        tertiary
        size="small"
        :disabled="
          duplicateCardStore.currentIndex >=
          duplicateCardStore.duplicateCards.size - 1
        "
        @click="showNext"
      >
        <template #icon>
          <n-icon :size="16" :component="NextOutline" />
        </template>
        {{ ft("next") }}
      </n-button>
    </div>
    <div
      v-if="duplicateCardStore.duplicateCards.size === 0"
      class="flex-center select-none gap-x-3 font-medium text-text-secondary"
    >
      {{ ft("no-duplicate-cards") }}
    </div>
  </TopAction>
</template>

<script setup lang="ts">
import TopAction from "@/components/top-action.vue"
import { PreviousOutline, NextOutline } from "@vicons/carbon"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useDuplicateCard } from "@/hooks/useDuplicateCard"

const { ft, t } = useHelpi18n()
const duplicateCardStore = useDuplicateCardStore()
const { showPrevious, showNext } = useDuplicateCard()
const show = ref(false)
function onCancel() {
  duplicateCardStore.setIsFindDuplicate(false)
}

watch(
  () => duplicateCardStore.isFindDuplicate,
  (value) => {
    show.value = value
  },
)
</script>
