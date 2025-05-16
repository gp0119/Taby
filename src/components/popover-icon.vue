<template>
  <n-popover
    trigger="hover"
    placement="bottom"
    :keep-alive-on-hover="false"
    :class="
      $attrs.class
        ? $attrs.class
        : '!rounded-md !bg-primary !px-2 !py-1 text-white'
    "
    content-class="!p-0"
    :arrow-class="$attrs['arrow-class'] ? $attrs['arrow-class'] : '!bg-primary'"
  >
    <template #trigger>
      <n-icon-wrapper
        v-if="wrapper"
        :size="size"
        :border-radius="size"
        :class="wrapperClass"
        @click.stop="onClick"
      >
        <n-icon :component="icon" :class="iconClass" />
      </n-icon-wrapper>
      <n-icon
        v-else
        :size="size"
        class="cursor-pointer"
        :class="iconClass"
        :component="icon"
        @click.stop="onClick"
      />
    </template>
    <div class="text-xs">{{ message }}</div>
  </n-popover>
</template>

<script setup lang="ts">
import { Component } from "vue"

withDefaults(
  defineProps<{
    message: string
    icon: Component
    size?: number | string
    iconClass?: string
    wrapperClass?: string
    wrapper?: boolean
  }>(),
  {
    wrapper: false,
  },
)

const $attrs = useAttrs()
console.log($attrs)

const emit = defineEmits<{
  (e: "click"): void
}>()

const onClick = () => {
  emit("click")
}
</script>
