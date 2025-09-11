<template>
  <div class="flex flex-col gap-y-3">
    <popoverWrapper
      :message="ft('import')"
      :disabled="!layoutStore.isLeftCollapsed"
      placement="right"
    >
      <n-button
        tertiary
        class="w-full overflow-hidden !px-0 !shadow-btn-shadow"
        :focusable="false"
        @click="onImport"
      >
        <n-icon
          size="18"
          class="flex w-[34px] flex-shrink-0 items-center justify-center"
          :component="DocumentImport"
        />
        <span
          :class="[
            layoutStore.isLeftCollapsed ? 'animate-hide' : 'animate-show',
          ]"
        >
          {{ ft("import") }}
        </span>
      </n-button>
    </popoverWrapper>
    <popoverWrapper
      :message="ft('export')"
      :disabled="!layoutStore.isLeftCollapsed"
      placement="right"
    >
      <n-button
        tertiary
        class="w-full overflow-hidden !px-0 !shadow-btn-shadow"
        :focusable="false"
        @click="onExport"
      >
        <n-icon
          size="18"
          class="flex w-[34px] flex-shrink-0 items-center justify-center"
          :component="DocumentExport"
        />
        <span
          :class="[
            layoutStore.isLeftCollapsed ? 'animate-hide' : 'animate-show',
          ]"
        >
          {{ ft("export") }}
        </span>
      </n-button>
    </popoverWrapper>

    <popoverWrapper
      :message="ft('sync')"
      :disabled="!layoutStore.isLeftCollapsed"
      placement="right"
    >
      <n-button
        tertiary
        class="w-full overflow-hidden !px-0 !shadow-btn-shadow"
        :focusable="false"
        @click="showSyncDialog = true"
      >
        <n-icon
          size="18"
          class="flex w-[34px] flex-shrink-0 items-center justify-center"
          :component="CloudDataOps"
        />
        <span
          :class="[
            layoutStore.isLeftCollapsed ? 'animate-hide' : 'animate-show',
          ]"
        >
          {{ ft("sync") }}
        </span>
      </n-button>
    </popoverWrapper>
  </div>
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
import popoverWrapper from "@/components/popover-wrapper.vue"

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
  const type = ref("taby")
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
              <n-radio-button class="w-1/2 text-center" value="taby">
                {ft("import-from", "taby")}
              </n-radio-button>
              <n-radio-button class="w-1/2 text-center" value="toby">
                {ft("import-from", "toby")}
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
