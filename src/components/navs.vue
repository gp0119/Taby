<template>
  <div
    class="flex h-[50px] items-center justify-between border-0 border-b border-solid px-4 py-2.5"
  >
    <span class="text-xl">{{ spacesStore.getActiveSpace.title }}</span>
    <n-button size="tiny" type="primary" @click="onAddCollection">
      <span>ADD COLLECTION</span>
      <template #icon>
        <n-icon>
          <Add />
        </n-icon>
      </template>
    </n-button>
  </div>
</template>

<script setup lang="tsx">
import { useSpacesStore } from "@/store/spaces.ts"
import { Add } from "@vicons/ionicons5"

const spacesStore = useSpacesStore()

const dialog = useDialog()
function onAddCollection() {
  const formModel = ref({ title: "" })
  dialog.create({
    title: () => {
      return <span>Add Collection</span>
    },
    titleClass: "[&_.n-base-icon]:hidden",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <n-form model={formModel.value}>
        <n-form-item label="Title">
          <n-input v-model:value={formModel.value.title} />
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: () => {
      if (!formModel.value.title) return
      spacesStore.addCollection({
        title: formModel.value.title,
        cards: [],
      })
    },
  })
}
</script>
