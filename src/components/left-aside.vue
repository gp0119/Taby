<template>
  <div class="flex h-full flex-col">
    <div>
      <div
        class="flex h-[50px] items-center border-0 border-b border-solid px-4 leading-[50px]"
      >
        <n-avatar :src="logo" :size="26" class="bg-white" />
        <span class="ml-2 select-none text-xl">Taby</span>
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
    <div class="space-container flex-1 px-4">
      <div
        class="space-item flex cursor-pointer items-center py-2 font-medium"
        v-for="item in allSpaces"
        :data-id="item.id"
        :class="{ 'text-red-450': activeSpaceId === item.id }"
        :key="item.title"
        @click="onHandleSpaceClick(item)"
      >
        <n-icon size="18" :component="StorefrontOutline" />
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
import { Add, SyncSharp, StorefrontOutline, LogoGithub } from "@vicons/ionicons5"
import { DocumentImport } from "@vicons/carbon"
import { useSpacesStore } from "@/store/spaces.ts"
import logo from "../assets/72.png"
import DanaManager from "@/db"
import { CollectionWithCards, Space } from "@/type"
import { UploadSettledFileInfo } from "naive-ui/es/upload/src/public-types"
import { FormInst } from "naive-ui"
import { uploadAll, downloadAll } from "@/sync/gistSync"
import Sortable from "sortablejs"

const spacesStore = useSpacesStore()
const dataManager = new DanaManager()

const refresh = async () => {
  await spacesStore.fetchSpaces()
  await spacesStore.fetchCollections(spacesStore.activeId)
}

const init = async () => {
  await spacesStore.initialize()
}

onMounted(async () => {
  setTimeout(async () => {
    await init()
  }, 100)
  createDraggable()
})

const allSpaces = computed(() => spacesStore.spaces)
const activeSpaceId = computed(() => spacesStore.activeId)

const createDraggable = () => {
  Sortable.create(document.querySelector(".space-container") as HTMLElement, {
    animation: 150,
    handle: ".space-item",
    ghostClass: "sortable-ghost-dashed-border",
    onEnd: async (evt) => {
      const { item: itemEl } = evt
      const element = itemEl.nextElementSibling || itemEl.previousElementSibling
      const currentSpaceId = itemEl.getAttribute("data-id")
      const targetSpaceId = element?.getAttribute("data-id")
      if (currentSpaceId && targetSpaceId) {
        await dataManager.moveSpace(
          Number(currentSpaceId),
          Number(targetSpaceId),
        )
        await refresh()
      }
    },
  })
}

const dialog = useDialog()
const message = useMessage()

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
      await dataManager.addSpace({
        title: formModel.value.title,
      })
      await spacesStore.initialize()
    },
  })
}

function onHandleSpaceClick(space: Space) {
  spacesStore.setActiveSpace(space.id!)
}

function onChange({ file }: { file: UploadSettledFileInfo }) {
  const reader = new FileReader()
  reader.onload = async (event) => {
    try {
      const lists: {
        lists: CollectionWithCards[]
      } = JSON.parse(event.target?.result as string)
      for (const list of lists.lists) {
        const collectionId = (await dataManager.addCollection({
          title: list.title,
          spaceId: activeSpaceId.value,
          labelIds: [],
        })) as number
        await dataManager.batchAddCards(
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
        await refresh()
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
    gistId: "",
    accessToken: "",
  })
  chrome.storage.sync.get(["accessToken", "gistId"], (result) => {
    if (result.accessToken) {
      formModel.value.accessToken = result.accessToken
    }
    if (result.gistId) {
      formModel.value.gistId = result.gistId
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
        <n-form-item
          label="AccessToken:"
          path="accessToken"
          label-style="width: 100%"
          v-slots={{
            label: () => (
              <div>
                <span>AccessToken:</span>
                <a href="https://github.com/settings/tokens" class="ml-2.5" target="_blank">
                  <n-icon size="12" component={LogoGithub} />{" "}
                  <span class="text-blue-500">Get AccessToken</span>
                </a>
              </div>
            ),
          }}
        >
          <n-input v-model:value={formModel.value.accessToken} />
        </n-form-item>
        <n-form-item
          label="GistId:"
          path="gistId"
          v-slots={{ label: () => <span>GistId:</span> }}
        >
          <n-input v-model:value={formModel.value.gistId} />
        </n-form-item>
      </n-form>
    ),
    action: () => (
      <n-space>
        <n-button
          type="primary"
          size="small"
          disabled={!formModel.value.accessToken}
          onClick={() => {
            formRef.value?.validate().then(async () => {
              try {
                const res = await uploadAll(
                  formModel.value.accessToken,
                  formModel.value.gistId,
                )
                await chrome.storage.sync.set({
                  accessToken: formModel.value.accessToken,
                  gistId: res,
                })
                message.success("同步成功")
                dialog.destroyAll()
              } catch (error) {
                message.error("上传失败")
              }
            })
          }}
        >
          上传本地
        </n-button>
        <n-button
          type="info"
          size="small"
          disabled={!(formModel.value.accessToken && formModel.value.gistId)}
          onClick={() => {
            try {
              formRef.value?.validate().then(async () => {
                await downloadAll(
                  formModel.value.accessToken,
                  formModel.value.gistId,
                )
                await chrome.storage.sync.set({
                  accessToken: formModel.value.accessToken,
                  gistId: formModel.value.gistId,
                })
                await refresh()
                dialog.destroyAll()
              })
              message.success("下载成功")
            } catch (error) {
              message.error("下载失败")
            }
          }}
        >
          下载远程
        </n-button>
      </n-space>
    ),
  })
}
</script>
