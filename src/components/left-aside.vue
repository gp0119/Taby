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
        <n-upload
          @change="onChange"
          trigger-class="w-full"
          accept=".json"
          :show-file-list="false"
          :max="1"
        >
          <n-button class="w-full">
            <span>导入</span>
            <template #icon>
              <n-icon size="18" :component="DocumentImport" />
            </template>
          </n-button>
        </n-upload>
        <n-button class="w-full" @click="onSync">
          <span>同步</span>
          <template #icon>
            <n-icon size="18" :component="SyncSharp" />
          </template>
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { Add, SyncSharp, BagHandleOutline } from "@vicons/ionicons5"
import { DocumentImport } from "@vicons/carbon"
import { useSpacesStore } from "@/store/spaces.ts"
import logo from "../assets/72.png"
import tabbyDatabaseService from "@/db"
import { CollectionWithCards, Space } from "@/type"
import { UploadSettledFileInfo } from "naive-ui/es/upload/src/public-types"
import { FormInst } from "naive-ui"
import { getGistById } from "@/sync/github.ts"

const spacesStore = useSpacesStore()

const allSpaces = await tabbyDatabaseService.getAllSpaces()
const collectionToSet = await tabbyDatabaseService.getCollectionWithCards(
  allSpaces[0].id,
)

onMounted(() => {
  spacesStore.setAllSpaces(allSpaces)
  spacesStore.setActiveSpaceId(allSpaces[0].id)
  spacesStore.setCurrentCollections(collectionToSet)
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
        await spacesStore.getCollectionsById(spacesStore.activeSpaceId)
      }
    } catch (error) {
      console.error("文件内容不是有效的 JSON", error)
    }
  }
  reader.readAsText(file.file as Blob)
}

function onSync() {
  const formRef = ref<FormInst | null>(null)
  const formModel = ref({
    id: "43af9f678b44e79fc5183cf2d0a4617d",
    accessToken: "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",
  })
  chrome.storage.sync.get(["accessToken", "id"], (result) => {
    console.log("result: ", result)
    if (result.accessToken && result.id) {
      formModel.value.accessToken = result.accessToken
      formModel.value.id = result.id
    }
  })
  const formRules = {
    accessToken: [{ required: true, message: "AccessToken is required" }],
  }
  dialog.create({
    title: "sync witn github",
    titleClass: "[&_.n-base-icon]:hidden",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <n-form
        ref={(el: FormInst) => (formRef.value = el)}
        model={formModel.value}
        rules={formRules}
        require-mark-placement="left"
      >
        <n-form-item label="AccessToken:" path="accessToken">
          <n-input v-model:value={formModel.value.accessToken} />
        </n-form-item>
        <n-form-item label="Id:" path="id:">
          <n-input v-model:value={formModel.value.id} />
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: () => {
      formRef.value?.validate((err) => {
        if (!err) {
          chrome.storage.sync.set({ accessToken: formModel.value.accessToken })
          chrome.storage.sync.set({ id: formModel.value.id })
          getGistById(formModel.value.id).then((res) => {
            console.log("res: ", res)
          })
          // console.log("formModel.value: ", formModel.value)
          // getGistsByUserName("gp0119").then((res) => {
          //   console.log("res: ", res)
          // })
          // fetch(`https://api.github.com/gists`, {
          //   method: "post",
          //   headers: {
          //     Accept: "application/vnd.github.v3+json",
          //     Authorization: `Bearer ${formModel.value.accessToken}`,
          //   },
          //   body: JSON.stringify({
          //     description: "Tabby sync " + new Date().toLocaleString(),
          //     public: false,
          //     files: {
          //       "tabby-sync-settings": {
          //         content: "tabby will sync here.",
          //       },
          //     },
          //   }),
          // })
          //   .then((response) => response.json())
          //   .then((json) => console.log(json))
        }
      })
      return false
    },
  })
}
</script>
