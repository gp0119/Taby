<template>
  <div class="flex h-full flex-col">
    <div>
      <div
        class="flex h-[50px] items-center border-0 border-b border-solid px-4 leading-[50px]"
      >
        <n-avatar :src="logo" :size="26" class="bg-white" />
        <span class="ml-2 select-none text-xl text-primary">Taby</span>
      </div>
      <div class="border-b border-border-color px-2 py-3">
        <div
          class="h-[30px] w-full cursor-pointer select-none whitespace-nowrap rounded border border-border-color bg-card-color px-2 text-xs font-thin leading-[30px] text-text-secondary"
          @click="openModal"
        >
          Ctrl / Command + F to search
        </div>
      </div>
      <div class="flex-between border-b border-border-color px-4 py-2.5">
        <span class="select-none font-bold text-text-primary">SPACES</span>
        <n-icon
          size="18"
          class="cursor-pointer text-primary"
          :component="FolderAdd"
          @click="onAddSpace"
        />
      </div>
    </div>
    <div class="flex-1 p-2">
      <SpaceWrapper
        :spaces="allSpaces"
        :active-space-id="activeSpaceId"
        @click="onHandleSpaceClick"
        @drag-end="onDragEnd"
      />
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
import { useSearchModal } from "@/hooks/useSearchModal.tsx"
import { SyncSharp, LogoGithub } from "@vicons/ionicons5"
import { DocumentImport, FolderAdd } from "@vicons/carbon"
import { useSpacesStore } from "@/store/spaces.ts"
import logo from "@/assets/72.png"
import DanaManager from "@/db"
import { CollectionWithCards, Space } from "@/type.ts"
import { useEventListener } from "@vueuse/core"
import { UploadSettledFileInfo } from "naive-ui/es/upload/src/public-types"
import { FormInst } from "naive-ui"
import { uploadAll, downloadAll } from "@/sync/gistSync.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import IconSelect from "@components/icon-select.vue"
import SpaceWrapper from "./components/space-wrapper.vue"
import { SortableEvent } from "vue-draggable-plus"

const spacesStore = useSpacesStore()
const dataManager = new DanaManager()
const { refreshSpaces, refreshCollections } = useRefresh()
const { openModal } = useSearchModal()

const init = async () => {
  await spacesStore.initialize()
}

const cleanup = useEventListener(window, "keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    e.preventDefault()
    e.stopPropagation()
    openModal()
  }
})

onMounted(async () => {
  setTimeout(async () => {
    await init()
  }, 100)
})

onUnmounted(() => {
  cleanup()
})

const allSpaces = computed(() => spacesStore.spaces)
const activeSpaceId = computed(() => spacesStore.activeId)

const onDragEnd = async (evt: SortableEvent) => {
  const { item: itemEl, oldIndex, newIndex } = evt
  if (newIndex === oldIndex) return
  const currentSpaceId = itemEl.getAttribute("data-id")
  await dataManager.moveSpace(Number(currentSpaceId), oldIndex!, newIndex!)
  await refreshSpaces()
}

const dialog = useDialog()
const message = useMessage()

function onAddSpace() {
  const formModel = ref({ title: "", icon: "StorefrontOutline" })
  dialog.create({
    title: () => {
      return <span>Add Space</span>
    },
    class: "bg-body-color",
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <n-form model={formModel.value}>
        <n-form-item label="Title">
          <n-input-group>
            <IconSelect v-model:value={formModel.value.icon} />
            <n-input v-model:value={formModel.value.title} />
          </n-input-group>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      if (!formModel.value.title) return
      await dataManager.addSpace({
        title: formModel.value.title,
        icon: formModel.value.icon,
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
        const labelIds: number[] = []
        await Promise.all(
          list.labels.map(async (item) => {
            const labelId = await dataManager.getOrCreateLabelWithTitle(
              item.title,
            )
            if (labelId) {
              labelIds.push(labelId)
            }
          }),
        )
        const collectionId = (await dataManager.addCollection({
          title: list.title,
          spaceId: activeSpaceId.value,
          labelIds,
        })) as number
        await dataManager.batchAddCards(
          list.cards
            .filter((item) => item.url !== "/note.html")
            .map((item, index) => {
              return {
                ...item,
                customTitle: item.customTitle || item.title,
                customDescription: item.customDescription || item.title,
                collectionId,
                order: (index + 1) * 1000,
              }
            }),
        )
        await refreshCollections()
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
    class: "bg-body-color",
    title: "sync witn github",
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
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
                <a
                  href="https://github.com/settings/tokens"
                  class="ml-2.5"
                  target="_blank"
                >
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
                await refreshSpaces()
                await refreshCollections()
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
