<template>
  <div
    class="scrollbar-thin scrollbar-gutter-stable flex h-[calc(100vh-60px)] flex-col gap-y-4 overflow-y-auto bg-content-bg py-4 pl-4 pr-2"
  >
    <div v-for="i in 6" :key="i" class="w-full rounded-lg bg-white p-4">
      <div class="mb-4 h-6 w-1/3 rounded-lg bg-content-bg" />
      <div class="h-20 w-full rounded-lg bg-content-bg" />
    </div>
  </div>
</template>
