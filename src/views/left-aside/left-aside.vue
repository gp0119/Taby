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
        <span class="select-none font-bold text-text-primary">{{
          ft("space")
        }}</span>
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
        <n-button class="w-full" @click="onImport">
          <span>{{ ft("import") }}</span>
          <template #icon>
            <n-icon size="18" :component="DocumentImport" />
          </template>
        </n-button>
        <n-button class="w-full" @click="onExport">
          <span>{{ ft("export") }}</span>
          <template #icon>
            <n-icon size="18" :component="DocumentExport" />
          </template>
        </n-button>
        <n-button class="w-full" @click="onSync">
          <span>{{ ft("sync") }}</span>
          <template #icon>
            <n-icon size="18" :component="SyncSharp" />
          </template>
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useSearchModal } from "@/hooks/useSearchModal.tsx"
import { useExport } from "@/views/left-aside/hooks/useExport.ts"
import { useImport } from "@/views/left-aside/hooks/useImport.ts"
import { SyncSharp, LogoGithub } from "@vicons/ionicons5"
import { DocumentImport, DocumentExport, FolderAdd } from "@vicons/carbon"
import { useSpacesStore } from "@/store/spaces.ts"
import logo from "@/assets/72.png"
import DanaManager from "@/db"
import { Space } from "@/type.ts"
import { useEventListener } from "@vueuse/core"
import { FormInst, UploadFileInfo } from "naive-ui"
import { uploadAll, downloadAll } from "@/sync/gistSync.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import IconSelect from "@components/icon-select.vue"
import SpaceWrapper from "./components/space-wrapper.vue"
import { SortableEvent } from "vue-draggable-plus"
import SpaceSelect from "@/components/space-select.vue"

const spacesStore = useSpacesStore()
const dataManager = new DanaManager()
const { refreshSpaces, refreshCollections } = useRefresh()
const { openModal } = useSearchModal()
const loadingBar = useLoadingBar()
const { ft } = useHelpi18n()

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
const { open } = useEditDialog()
const { importFromToby, importFromTaby } = useImport()
const { exportFromTaby } = useExport()

function onAddSpace() {
  const formModel = ref({ title: "", icon: "StorefrontOutline" })
  open({
    title: ft("add", "space"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item label={ft("title")}>
          <n-input-group>
            <IconSelect v-model:value={formModel.value.icon} />
            <n-input
              v-model:value={formModel.value.title}
              placeholder={ft("placeholder", "title")}
            />
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

function onImport() {
  const type = ref("toby")
  const formModel = ref<{
    spaceId: number
    fileList: UploadFileInfo[]
  }>({
    spaceId: spacesStore.activeId,
    fileList: [],
  })
  open({
    title: ft("import"),
    renderContent: () => {
      return (
        <n-form model={formModel.value}>
          <n-form-item>
            <n-radio-group class="w-full" v-model:value={type.value}>
              <n-radio-button class="w-1/2 text-center" value="toby">
                {ft("import-from", "toby")}
              </n-radio-button>
              <n-radio-button class="w-1/2 text-center" value="taby">
                {ft("import-from", "taby")}
              </n-radio-button>
            </n-radio-group>
          </n-form-item>
          {type.value === "toby" && (
            <n-form-item label={ft("space")}>
              <SpaceSelect v-model:value={formModel.value.spaceId} />
            </n-form-item>
          )}
          <n-form-item label-placement="left">
            <n-upload
              v-model:fileList={formModel.value.fileList}
              accept=".json"
              max={1}
            >
              <n-button>{ft("select-file")}</n-button>
            </n-upload>
          </n-form-item>
        </n-form>
      )
    },
    onPositiveClick: async () => {
      if (!formModel.value.fileList.length) return
      loadingBar.start()
      if (type.value === "toby") {
        await importFromToby(
          formModel.value.spaceId,
          formModel.value.fileList[0].file!,
        )
      } else {
        await importFromTaby(formModel.value.fileList[0].file!)
        await refreshSpaces()
      }
      await refreshCollections()
      message.success(ft("success", "import"))
      loadingBar.finish()
    },
  })
}

function onExport() {
  const formModel = ref({
    spaceIds: [spacesStore.activeId],
  })
  open({
    title: ft("export"),
    renderContent: () => {
      return (
        <n-form model={formModel.value}>
          <n-form-item label={ft("space")}>
            <SpaceSelect multiple v-model:value={formModel.value.spaceIds} />
          </n-form-item>
        </n-form>
      )
    },
    onPositiveClick: () => {
      exportFromTaby(formModel.value.spaceIds)
    },
  })
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
  open({
    title: ft("sync-with", "gist"),
    renderContent: () => (
      <n-form
        ref={(el: FormInst) => (formRef.value = el)}
        model={formModel.value}
        rules={formRules}
        require-mark-placement="left"
      >
        <n-form-item
          path="accessToken"
          label-style="width: 100%"
          v-slots={{
            label: () => (
              <a href="https://github.com/settings/tokens" target="_blank">
                <n-icon size="12" component={LogoGithub} />{" "}
                <span class="text-blue-500">{ft("access-token")}:</span>
              </a>
            ),
          }}
        >
          <n-input v-model:value={formModel.value.accessToken} />
        </n-form-item>
        <n-form-item
          path="gistId"
          v-slots={{ label: () => <span>{ft("gist-id")}:</span> }}
        >
          <n-input v-model:value={formModel.value.gistId} />
        </n-form-item>
      </n-form>
    ),
    renderAction: () => (
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
                message.success(ft("success", "upload"))
                dialog.destroyAll()
              } catch (error) {
                message.error(ft("success", "upload"))
              }
            })
          }}
        >
          {ft("upload-local")}
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
          {ft("download-remote")}
        </n-button>
      </n-space>
    ),
  })
}
</script>
