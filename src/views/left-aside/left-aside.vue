<template>
  <div class="flex h-full flex-col" v-bind="$attrs">
    <div>
      <a href="https://github.com/gp0119/Taby" target="_blank">
        <div
          class="flex h-[50px] items-center border-0 border-b border-solid px-4 text-primary"
        >
          <Logo class="h-7 w-auto" />
        </div>
      </a>
      <div class="border-b border-border-color px-2 py-3">
        <div
          class="h-[30px] w-full cursor-pointer select-none whitespace-nowrap rounded border border-border-color bg-card-color px-2 text-xs font-thin leading-[30px] text-text-secondary"
          @click="openModal"
        >
          {{ ft("placeholder-search") }}
        </div>
      </div>
      <div class="flex-between border-b border-border-color px-4 py-2.5">
        <span class="select-none font-bold text-text-primary">
          {{ ft("space") }}
        </span>
        <PopoverIcon
          :message="ft('add', 'space')"
          size="18"
          :icon="FolderAdd"
          icon-class="text-primary"
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
        <n-button
          type="primary"
          ghost
          class="w-full"
          :focusable="false"
          @click="onImport"
        >
          <span class="w-8">{{ ft("import") }}</span>
          <template #icon>
            <n-icon size="18" :component="DocumentImport" />
          </template>
        </n-button>
        <n-button
          type="primary"
          ghost
          class="w-full"
          :focusable="false"
          @click="onExport"
        >
          <span class="w-8">{{ ft("export") }}</span>
          <template #icon>
            <n-icon size="18" :component="DocumentExport" />
          </template>
        </n-button>
        <n-button
          secondary
          type="primary"
          class="w-full"
          :focusable="false"
          @click="showSyncDialog = true"
        >
          <span class="w-8">{{ ft("sync") }}</span>
          <template #icon>
            <n-icon size="18" :component="CloudDataOps" />
          </template>
        </n-button>
      </n-space>
    </div>
  </div>
  <SyncDialog v-model:show="showSyncDialog" />
</template>

<script setup lang="tsx">
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useSearchModal } from "@/hooks/useSearchModal.tsx"
import { useExport } from "@/views/left-aside/hooks/useExport.ts"
import { useImport } from "@/views/left-aside/hooks/useImport.ts"
import {
  DocumentImport,
  DocumentExport,
  FolderAdd,
  CloudDataOps,
  Upload,
} from "@vicons/carbon"
import { useSpacesStore } from "@/store/spaces.ts"
import { Space } from "@/type.ts"
import { useEventListener } from "@vueuse/core"
import { UploadFileInfo } from "naive-ui"
import { useRefresh } from "@/hooks/useRresh.ts"
import IconSelect from "@components/icon-select.vue"
import SpaceWrapper from "./components/space-wrapper.vue"
import { SortableEvent } from "vue-draggable-plus"
import SpaceSelect from "@/components/space-select.vue"
import dataManager from "@/db"
import SyncDialog from "./components/sync-dialog.vue"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import PopoverIcon from "@/components/popover-icon.vue"
import Logo from "@/components/logo.vue"

const spacesStore = useSpacesStore()
const { refreshSpaces, refreshCollections, refreshTags } = useRefresh()
const { openModal } = useSearchModal()
const loadingBar = useLoadingBar()
const { ft } = useHelpi18n()
const duplicateCardStore = useDuplicateCardStore()

const showSyncDialog = ref(false)

const cleanup = useEventListener(window, "keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    e.preventDefault()
    e.stopPropagation()
    openModal()
  }
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
        <n-form-item label={`${ft("title")}:`}>
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
      await refreshSpaces()
    },
  })
}

const { setLoading } = inject("loading") as {
  setLoading: (value: boolean) => void
}
async function onHandleSpaceClick(space: Space) {
  setLoading(true)
  await spacesStore.setActiveSpace(space.id!)
  await refreshTags()
  duplicateCardStore.clearDuplicateCards()
  setLoading(false)
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
          <n-form-item label-placement="left">
            <n-upload
              directory-dnd
              v-model:fileList={formModel.value.fileList}
              accept=".json"
              max={1}
            >
              <n-upload-dragger class="flex flex-col items-center bg-card-color text-text-secondary">
                <n-icon size="32" component={Upload} />
                <span class="mt-2.5">{ft("select-file")}</span>
              </n-upload-dragger>
            </n-upload>
          </n-form-item>
        </n-form>
      )
    },
    onPositiveClick: async () => {
      if (!formModel.value.fileList.length) return
      loadingBar.start()
      try {
        if (type.value === "toby") {
          await importFromToby(formModel.value.fileList[0].file!)
        } else {
          await importFromTaby(formModel.value.fileList[0].file!)
        }
        await refreshSpaces()
        await refreshCollections()
        message.success(ft("success", "import"))
      } finally {
        loadingBar.finish()
      }
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
          <n-form-item label={`${ft("space")}:`}>
            <SpaceSelect
              multiple
              addable={false}
              v-model:value={formModel.value.spaceIds}
            />
          </n-form-item>
        </n-form>
      )
    },
    onPositiveClick: () => {
      exportFromTaby(formModel.value.spaceIds)
    },
  })
}
</script>
