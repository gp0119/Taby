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
    <div class="px-2.5 py-4">
      <n-space vertical>
        <n-button class="w-full" @click="onImport"
          >导入
          <template #icon>
            <n-icon size="18" :component="DocumentImport" />
          </template>
        </n-button>
        <n-button class="w-full"
          >设置
          <template #icon>
            <n-icon size="18" :component="SettingsOutline" />
          </template>
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="tsx">
import {
  Add,
  SettingsOutline,
  BagHandleOutline,
  ArchiveOutline,
} from "@vicons/ionicons5"
import { DocumentImport } from "@vicons/carbon"
import { useSpacesStore } from "@/store/spaces.ts"
import logo from "../assets/72.png"
import tabbyDatabaseService from "@/db"
import { Collection, CollectionWithCards, Space } from "@/type"
import { UploadSettledFileInfo } from "naive-ui/es/upload/src/public-types"

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

function onImport() {
  dialog.create({
    title: "Import",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <n-form>
        <n-upload
          accept=".json"
          on-change={onChange}
          max={1}
          show-file-list={false}
        >
          <n-upload-dragger>
            <div class="mt-2.5">
              <n-icon size="48" depth={3}>
                <ArchiveOutline />
              </n-icon>
            </div>
            <n-text class="text-base">
              Click or drag files to the area to upload them
            </n-text>
            <n-p depth="3" class="mt-2.5">
              Please upload. json file
            </n-p>
          </n-upload-dragger>
        </n-upload>
      </n-form>
    ),
    onPositiveClick: async () => {},
  })
}

function onChange({ file }: { file: UploadSettledFileInfo }) {
  const reader = new FileReader()
  reader.onload = async (event) => {
    try {
      const lists: {
        lists: CollectionWithCards[]
      } = JSON.parse(event.target?.result as string)
      for (const list of lists.lists) {
        const collectionId = await tabbyDatabaseService.addCollection({
          title: list.title,
          spaceId: spacesStore.activeSpaceId,
          labelIds: [],
        })
        await tabbyDatabaseService.batchAddCards(
          list.cards.map((item, index) => {
            return {
              ...item,
              customTitle: item.customTitle || item.title,
              customDescription: item.customDescription || item.title,
              collectionId,
              order: (index + 1) * 1000,
            }
          }),
        )
      }
    } catch (error) {
      console.error("文件内容不是有效的 JSON", error)
    }
  }
  reader.readAsText(file.file as Blob)
}
</script>
