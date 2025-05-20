<template>
  <div
    class="flex h-10 w-10 cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200"
  >
    <div class="bg-content-bg flex items-center gap-0.5 px-0.5 py-1">
      <span class="h-1 w-1 rounded-full bg-gray-400" />
      <span class="h-1 w-1 rounded-full bg-gray-400" />
      <span class="h-1 w-1 rounded-full bg-gray-400" />
    </div>
    <div
      class="flex flex-1 items-center justify-center font-bold text-gray-400"
    >
      <slot />
    </div>
  </div>
</template>
