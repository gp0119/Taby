<template>
  <aside :style="{ width: collapsed ? collapsedWidth + 'px' : width + 'px' }">
    <div v-if="$slots.header">
      <slot name="header" />
    </div>
    <div>
      <slot />
    </div>
    <div v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </aside>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    side: "left" | "right"
    collapsed: boolean
    collapsedWidth?: number
    width?: number
  }>(),
  {
    collapsedWidth: 50,
    width: 200,
  },
)
</script>
