<template>
  <div
    class="scrollbar-thin scrollbar-gutter-stable bg-content-color flex h-[calc(100vh-60px)] flex-col gap-y-4 overflow-y-auto py-2 pl-4 pr-2"
  >
    <div v-for="i in 6" :key="i" class="w-full rounded-lg bg-card-color p-4">
      <div class="bg-content-color mb-4 h-6 w-1/3 rounded-lg" />
      <div class="bg-content-color h-20 w-full rounded-lg" />
    </div>
  </div>
</template>
