<template>
  <n-popover v-bind="$attrs">
    <template #trigger>
      <slot name="trigger" />
    </template>
    <slot />
  </n-popover>
</template>
