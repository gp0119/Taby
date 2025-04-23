<template>
  <!-- Click to Bookmark Section -->
  <section class="mx-auto w-full max-w-6xl px-4 py-16">
    <div class="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
      <!-- Left Content -->
      <div class="space-y-8">
        <h2 class="text-3xl font-bold text-gray-900 md:text-4xl">
          Just in 3 clicks
          <br />
          you can bookmark...
        </h2>

        <!-- Option 1: Single Tab -->
        <div class="rounded-lg border border-gray-200/80 p-6">
          <div class="mb-3 flex items-center">
            <span class="mr-1.5 h-3 w-3 rounded-full bg-gray-900"></span>
            <span
              class="mr-1.5 h-3 w-3 rounded-full bg-gray-300 opacity-50"
            ></span>
            <span
              class="mr-1.5 h-3 w-3 rounded-full bg-gray-300 opacity-50"
            ></span>
            <span class="h-3 w-3 rounded-full bg-gray-300 opacity-50"></span>
          </div>
          <h3 class="mb-1 text-lg font-semibold text-gray-900">Single Tab</h3>
          <p class="text-sm text-gray-600">
            Interesting article, shopping list item, trip destination... Save
            everything useful!
          </p>
        </div>

        <!-- Option 2: All Window Tabs (Selected) -->
        <div class="rounded-lg border border-gray-200 bg-gray-100/80 p-6">
          <div class="mb-3 flex items-center">
            <span class="mr-1.5 h-3 w-3 rounded-full bg-gray-900"></span>
            <span class="mr-1.5 h-3 w-3 rounded-full bg-gray-900"></span>
            <span class="mr-1.5 h-3 w-3 rounded-full bg-gray-900"></span>
            <span class="h-3 w-3 rounded-full bg-gray-900"></span>
          </div>
          <h3 class="mb-1 text-lg font-semibold text-gray-900">
            All Window Tabs
          </h3>
          <p class="text-sm text-gray-600">
            Entire topic, entire research or project... All fits perfectly a
            Taby folder.
          </p>
        </div>
      </div>

      <!-- Right Content (Screenshot) -->
      <div
        class="flex h-80 items-center justify-center rounded-lg bg-gray-200 text-gray-400 shadow-lg"
      >
        App Screenshot/Demo Placeholder
      </div>
    </div>
  </section>
</template>

<script setup></script>
