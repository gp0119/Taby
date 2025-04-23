<template>
  <Transition name="fade" appear>
    <section class="mx-auto w-full max-w-5xl px-4 py-16">
      <div
        class="grid grid-cols-1 gap-8 border-t border-gray-200 pt-12 md:grid-cols-2 md:gap-12"
      >
        <!-- Left Column: With Taby -->
        <div
          class="rounded-lg border border-gray-200/80 bg-white/80 p-6 shadow-sm"
        >
          <div class="mb-4 h-48 rounded border border-gray-200 bg-white p-3">
            <!-- Simplified Browser Mockup: Organized -->
            <div class="mb-2 flex items-center space-x-1.5">
              <span class="h-3 w-3 rounded-full bg-red-400"></span>
              <span class="h-3 w-3 rounded-full bg-yellow-400"></span>
              <span class="h-3 w-3 rounded-full bg-green-400"></span>
            </div>
            <div class="mb-3 flex h-6 items-center rounded bg-gray-100 px-2">
              <span class="text-xs text-gray-500">📄 My Project</span>
            </div>
            <div class="flex h-6 items-center rounded bg-gray-100 px-2">
              <span class="text-xs text-gray-500">🛒 Shopping List</span>
            </div>
            <!-- ... more organized content ... -->
          </div>
          <div class="text-center">
            <span
              class="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800"
            >
              Browser with Taby
            </span>
          </div>
        </div>

        <!-- Right Column: Without Taby -->
        <div
          class="rounded-lg border border-gray-200/80 bg-white/80 p-6 shadow-sm"
        >
          <div
            class="mb-4 h-48 overflow-hidden rounded border border-gray-200 bg-white p-3"
          >
            <!-- Simplified Browser Mockup: Cluttered -->
            <div class="mb-2 flex items-center space-x-1.5">
              <span class="h-3 w-3 rounded-full bg-gray-300"></span>
              <span class="h-3 w-3 rounded-full bg-gray-300"></span>
              <span class="h-3 w-3 rounded-full bg-gray-300"></span>
            </div>
            <div class="mb-2 flex space-x-1">
              <span class="h-5 w-10 rounded-sm bg-gray-200"></span>
              <span class="h-5 w-10 rounded-sm bg-gray-200"></span>
              <span class="h-5 w-10 rounded-sm bg-gray-200"></span>
              <span class="h-5 w-10 rounded-sm bg-gray-200"></span>
              <span class="h-5 w-10 rounded-sm bg-gray-200"></span>
              <span class="h-5 w-10 rounded-sm bg-gray-200"></span>
              <span class="h-5 w-10 rounded-sm bg-gray-200"></span>
              <span class="h-5 w-10 rounded-sm bg-gray-200"></span>
              <span class="h-5 w-10 rounded-sm bg-gray-200"></span>
            </div>
            <div class="h-6 rounded bg-gray-100"></div>
            <!-- ... more cluttered content ... -->
          </div>
          <div class="text-center">
            <span
              class="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
            >
              Browser without Taby
            </span>
          </div>
        </div>
      </div>
    </section>
  </Transition>
</template>

<script setup>
// No specific script logic needed for this static component
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
