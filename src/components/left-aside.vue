<template>
  <div class="flex h-full flex-col">
    <div>
      <div
        class="flex h-[50px] items-center border-0 border-b border-solid px-4 leading-[50px]"
      >
        <n-avatar :src="logo" :size="26" class="bg-white" />
        <span class="ml-2 select-none text-xl">Tabby</span>
      </div>
      <div class="flex justify-between px-4 py-2.5">
        <span class="select-none font-bold">SPACES</span>
        <n-icon
          size="18"
          class="cursor-pointer text-red-600"
          :component="Add"
          @click="onAddSpace"
        />
      </div>
    </div>
    <div class="flex-1 px-4">
      <div
        class="flex cursor-pointer items-center py-2 font-medium"
        v-for="item in spacesStore.allSpaces"
        :class="{ 'text-red-450': spacesStore.activeSpaceId === item.id }"
        :key="item.title"
        @click="onHandleSpaceClick(item)"
      >
        <n-icon size="18" :component="BagHandleOutline" />
        <span class="select-none px-1">{{ item.title }}</span>
      </div>
    </div>
    <div class="border-0 border-t border-solid px-2.5 py-4">
      <div class="flex items-center">
        <n-icon size="18" :component="SettingsOutline" />
        <span class="px-1">Setting</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { Add, SettingsOutline, BagHandleOutline } from "@vicons/ionicons5"
import { useSpacesStore } from "@/store/spaces.ts"
import logo from "../assets/72.png"
import tabbyDatabaseService from "@/db"
import { Space } from "@/type"

const spacesStore = useSpacesStore()

onMounted(async () => {
  const allSpaces = await tabbyDatabaseService.getAllSpaces()
  spacesStore.setAllSpaces(allSpaces)
  spacesStore.setActiveSpaceId(allSpaces[0].id)
})

const dialog = useDialog()
function onAddSpace() {
  const formModel = ref({ title: "" })
  dialog.create({
    title: () => {
      return <span>Add Space</span>
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
      await tabbyDatabaseService.addSpace({
        title: formModel.value.title,
      })
      spacesStore.setAllSpaces(await tabbyDatabaseService.getAllSpaces())
    },
  })
}

async function onHandleSpaceClick(space: Space) {
  spacesStore.setActiveSpaceId(space.id)
}
</script>
