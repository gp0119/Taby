<template>
  <div
    class="flex h-10 w-10 flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border-[3px] border-primary"
  >
    <div
      class="flex items-center justify-center gap-0.5 bg-content-bg px-0.5 py-1"
    >
      <span class="h-1 w-1 rounded-full bg-gray-400" />
      <span class="h-1 w-1 rounded-full bg-gray-400" />
      <span class="h-1 w-1 rounded-full bg-gray-400" />
    </div>
    <div
      class="flex flex-1 items-center justify-center bg-white font-bold text-gray-400"
    >
      <slot />
    </div>
  </div>
</template>
