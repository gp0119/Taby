<template>
  <div class="flex h-[50px] items-center justify-between overflow-hidden px-3">
    <a
      href="https://github.com/gp0119/Taby"
      target="_blank"
      class="flex flex-shrink-0 items-center justify-center text-primary"
    >
      <Logo />
    </a>
    <PopoverWrapper :message="ft('add', 'space')">
      <n-button
        quaternary
        :focusable="false"
        size="small"
        class="mobile-manage-action ml-3 w-[28px]"
        :class="[layoutStore.isLeftCollapsed ? 'animate-hide' : 'animate-show']"
        :aria-label="ft('add', 'space')"
        @click="emit('add-space')"
      >
        <template #icon>
          <n-icon
            :component="Add"
            size="24"
            class="[&_svg]:stroke-current [&_svg]:stroke-[0.5px]"
          />
        </template>
      </n-button>
    </PopoverWrapper>
  </div>
</template>

<script setup lang="tsx">
import { useLayoutStore } from "@/store/layout"
import { Add } from "@vicons/carbon"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import Logo from "@/components/logo.vue"

const layoutStore = useLayoutStore()
const { ft } = useHelpi18n()
const emit = defineEmits<{
  (e: "add-space"): void
}>()
</script>
