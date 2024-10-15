<template>
  <div class="flex h-full flex-col">
    <div>
      <div
        class="flex h-[50px] items-center border-0 border-b border-solid px-4 leading-[50px]"
      >
        <n-avatar :src="logo" :size="26" class="bg-white" />
        <span class="ml-2 text-xl">Tabby</span>
      </div>
      <div class="flex justify-between px-4 py-2.5">
        <span class="font-bold">SPACES</span>
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
        v-for="(item, index) in spacesStore.mySpaces"
        :class="{ 'text-red-450': spacesStore.activeSpaceIndex === index }"
        :key="item.title"
        @click="spacesStore.updateActiveSpaceIndex(index)"
      >
        <n-icon size="18" :component="BagHandleOutline" />
        <span class="px-1">{{ item.title }}</span>
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
const spacesStore = useSpacesStore()

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
    onPositiveClick: () => {
      if (!formModel.value.title) return
      spacesStore.addSpace({
        title: formModel.value.title,
        spaces: [],
      })
    },
  })
}
</script>
