<template>
  <n-space vertical>
    <n-button
      tertiary
      class="!shadow"
      :class="{ 'w-full': !layoutStore.leftAsideCollapsed }"
      :focusable="false"
      @click="onImport"
    >
      <span v-if="!layoutStore.leftAsideCollapsed" class="w-8">
        {{ ft("import") }}
      </span>
      <template #icon>
        <n-icon size="18" :component="DocumentImport" />
      </template>
    </n-button>
    <n-button
      tertiary
      class="!shadow"
      :class="{ 'w-full': !layoutStore.leftAsideCollapsed }"
      :focusable="false"
      @click="onExport"
    >
      <span v-if="!layoutStore.leftAsideCollapsed" class="w-8">
        {{ ft("export") }}
      </span>
      <template #icon>
        <n-icon size="18" :component="DocumentExport" />
      </template>
    </n-button>
    <n-button
      tertiary
      class="!shadow"
      :class="{ 'w-full': !layoutStore.leftAsideCollapsed }"
      :focusable="false"
      @click="showSyncDialog = true"
    >
      <span v-if="!layoutStore.leftAsideCollapsed" class="w-8">
        {{ ft("sync") }}
      </span>
      <template #icon>
        <n-icon size="18" :component="CloudDataOps" />
      </template>
    </n-button>
  </n-space>
  <SyncDialog v-model:show="showSyncDialog" />
</template>

<script setup lang="tsx">
import { useHelpi18n } from "@/hooks/useHelpi18n"
import {
  DocumentImport,
  DocumentExport,
  CloudDataOps,
  Upload,
} from "@vicons/carbon"
import { UploadFileInfo } from "naive-ui"
import { useSpacesStore } from "@/store/spaces"
import { useLoadingBar } from "naive-ui"
import { useEditDialog } from "@/hooks/useEditDialog"
import { useImport } from "@/views/left-aside/hooks/useImport"
import { useExport } from "@/views/left-aside/hooks/useExport"
import { useRefresh } from "@/hooks/useRresh"
import SpaceSelect from "@/components/space-select.vue"
import SyncDialog from "@/views/left-aside/components/sync-dialog.vue"
import { useLayoutStore } from "@/store/layout"

const { ft } = useHelpi18n()
const spacesStore = useSpacesStore()
const loadingBar = useLoadingBar()
const { open } = useEditDialog()
const { importFromToby, importFromTaby } = useImport()
const { exportFromTaby } = useExport()
const { refreshSpaces, refreshCollections } = useRefresh()
const message = useMessage()
const layoutStore = useLayoutStore()
const showSyncDialog = ref(false)

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
