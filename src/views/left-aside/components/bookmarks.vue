<template>
  <div>
    <div
      v-if="!isHasRight"
      class="relative flex w-full flex-col justify-center gap-y-4 bg-white p-4"
    >
      <n-skeleton height="20px" class="opacity-30" />
      <n-skeleton height="20px" class="opacity-30" />
      <n-skeleton height="20px" class="opacity-30" />
      <n-button
        type="primary"
        class="absolute right-1/2 top-1/2 z-10 -translate-y-1/2 translate-x-1/2"
        @click="onGrantAccess"
      >
        grant access
      </n-button>
    </div>
    <div v-else>
      <div v-for="item in bookmarksTree" :key="item.id">
        <div>{{ item.title }}</div>
        <div>{{ item.children?.length }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isHasRight = ref(false)

const bookmarksTree = ref<any[]>([])
function onGrantAccess() {
  chrome.permissions.request({ permissions: ["bookmarks"] }, (granted) => {
    if (granted) {
      isHasRight.value = true
      chrome.bookmarks.getTree((tree) => {
        console.log("tree: ", tree)
        if (tree?.length > 0) {
          bookmarksTree.value = tree[0].children || []
        }
      })
    }
  })
}
</script>
