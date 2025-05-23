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
        class="fixed left-1/2 top-2 z-10 -translate-x-1/2 cursor-move rounded-xl bg-card-color shadow-base-lg"
      >
        <div class="flex items-center justify-between gap-x-8 px-6 py-4">
          <slot name="default" />
          <n-button
            secondary
            circle
            size="small"
            type="error"
            @click="onCancel"
          >
            <template #icon>
              <n-icon :size="20" :component="Close" />
            </template>
          </n-button>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { Close } from "@vicons/carbon"

const show = defineModel<boolean>("show", {
  default: false,
})

const emit = defineEmits<{
  (e: "close"): void
}>()

const onCancel = () => {
  show.value = false
  emit("close")
}
</script>
