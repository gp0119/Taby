<template>
  <div class="h-[calc(100vh-100px)] overflow-y-auto">
    <div
      v-for="i in 5"
      :key="i"
      class="w-full animate-pulse border-b border-border-color p-4"
    >
      <div class="mb-4 h-7 w-1/3 rounded bg-card-color"></div>
      <div class="h-24 w-full rounded bg-card-color"></div>
    </div>
  </div>
</template>
