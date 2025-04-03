<template>
  <teleport to="body">
    <transition
      enter-active-class="transition-all duration-300 ease-in-out"
      leave-active-class="transition-all duration-300 ease-in-out"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <div
        v-if="show"
        class="pointer-events-auto fixed left-1/2 top-3 z-10 w-[440px] -translate-x-1/2 cursor-move rounded-xl bg-card-color shadow-base-lg"
        @mousedown="onMouseDown"
        :style="{
          left: clientX,
        }"
      >
        <n-icon
          class="absolute right-1.5 top-1 z-10 cursor-pointer text-gray-400"
          :size="20"
          :component="Close"
          @click="closeDrawer"
        />
        <div class="relative px-4 py-6">
          <div class="flex flex-col justify-center gap-3">
            <div class="flex-center select-none gap-3 text-lg">
              <span class="text-center font-medium text-primary">
                {{
                  duplicateCardStore.duplicateCards.size > 0
                    ? duplicateCardStore.currentIndex + 1
                    : 0
                }}
              </span>
              <span>/</span>
              <span
                class="text-center text-text-secondary"
                v-html="
                  gt('duplicate-cards', duplicateCardStore.duplicateCards.size)
                "
              ></span>
            </div>
            <div class="flex-center gap-3">
              <n-button
                secondary
                :disabled="duplicateCardStore.currentIndex === 0"
                type="primary"
                @click="onShowPrevious"
              >
                <template #icon>
                  <n-icon :size="16" :component="PreviousOutline" />
                </template>
                {{ ft("previous") }}
              </n-button>
              <n-button
                secondary
                :disabled="
                  duplicateCardStore.currentIndex >=
                  duplicateCardStore.duplicateCards.size - 1
                "
                type="primary"
                @click="onShowNext"
              >
                <template #icon>
                  <n-icon :size="16" :component="NextOutline" />
                </template>
                {{ ft("next") }}
              </n-button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="tsx">
import { useSpacesStore } from "@/store/spaces.ts"
import { Close, PreviousOutline, NextOutline } from "@vicons/carbon"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { throttle } from "lodash-es"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import { useDuplicateCard } from "@/hooks/useDuplicateCard"

const show = ref(false)
const duplicateCardStore = useDuplicateCardStore()

const spacesStore = useSpacesStore()
const { ft, gt } = useHelpi18n()
const { findDuplicateCards } = useDuplicateCard()

const closeDrawer = () => {
  show.value = false
  duplicateCardStore.setIsFindDuplicate(false)
  duplicateCardStore.clearDuplicateCards()
}

watch(
  () => duplicateCardStore.isFindDuplicate,
  () => {
    show.value = duplicateCardStore.isFindDuplicate
    if (show.value) {
      findDuplicateCards(spacesStore.collections)
    } else {
      duplicateCardStore.clearDuplicateCards()
    }
  },
  { immediate: true },
)

const clientX = ref("50%")
const onMouseDown = (e: MouseEvent) => {
  const startX = e.clientX
  const startLeft =
    clientX.value === "50%" ? window.innerWidth / 2 : parseInt(clientX.value)

  const onMouseMove = throttle((e: MouseEvent) => {
    const deltaX = e.clientX - startX
    let newLeft = startLeft + deltaX

    const halfWidth = 220
    const minX = halfWidth
    const maxX = window.innerWidth - halfWidth

    if (newLeft < minX) newLeft = minX
    if (newLeft > maxX) newLeft = maxX

    clientX.value = `${newLeft}px`
  }, 16)

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("mouseup", onMouseUp)
  }

  document.addEventListener("mousemove", onMouseMove)
  document.addEventListener("mouseup", onMouseUp)
}

const onShowPrevious = () => {
  console.log("onShowPrevious")
  duplicateCardStore.setCurrentIndex(duplicateCardStore.currentIndex - 1)
}

const onShowNext = () => {
  console.log("onShowNext")
  duplicateCardStore.setCurrentIndex(duplicateCardStore.currentIndex + 1)
}
</script>
