<template>
  <div
    class="flex h-[50px] items-center justify-between border-0 border-b border-solid px-4 py-2.5"
  >
    <span class="select-none text-xl">{{ title }}</span>
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
import DataManager from "@/db"

const spacesStore = useSpacesStore()
const dataManager = new DataManager()

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
    onPositiveClick: async () => {
      if (!formModel.value.title) return
      await dataManager.addCollection({
        title: formModel.value.title,
        spaceId: spacesStore.activeId,
        labelIds: [],
      })
      await spacesStore.fetchCollections(spacesStore.activeId)
    },
  })
}

const title = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.title,
)
</script>
