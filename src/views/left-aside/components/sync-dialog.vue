<template>
  <n-modal
    v-model:show="show"
    preset="dialog"
    :title="ft('sync-with-gist')"
    titleClass="[&_.n-base-icon]:hidden !text-text-primary"
    class="bg-body-color"
  >
    <n-form
      ref="formRef"
      :model="formModel"
      :rules="rules"
      require-mark-placement="left"
    >
      <n-form-item :label="`${ft('sync-type')}:`" path="syncType">
        <n-select
          :value="formModel.syncType"
          :options="syncTypeOptions"
          :render-label="renderLabel"
          @update:value="handleSyncTypeChange"
        />
      </n-form-item>
      <n-form-item label-style="width: 100%" path="accessToken">
        <template #label>
          <a
            :href="
              formModel.syncType === 'github'
                ? 'https://github.com/settings/tokens'
                : 'https://gitee.com/personal_access_tokens'
            "
            target="_blank"
          >
            <span class="text-blue-500">{{ ft("access-token") }}:</span>
          </a>
        </template>
        <n-input
          v-model:value="formModel.accessToken"
          :placeholder="ft('placeholder', 'access-token')"
          @update:value="handleAccessTokenChange"
        />
      </n-form-item>
      <n-form-item path="gistId" :label="`${ft('gist-id')}:`">
        <n-input
          v-model:value="formModel.gistId"
          :placeholder="ft('placeholder', 'gist-id')"
          @update:value="handleGistIdChange"
        />
      </n-form-item>
    </n-form>
    <template #action>
      <div class="flex justify-end gap-2">
        <n-button
          type="primary"
          size="small"
          :disabled="!formModel.accessToken"
          @click="handleUpload"
        >
          <template #icon>
            <n-icon size="14" :component="CloudUpload" />
          </template>
          {{ ft("upload-local") }}
        </n-button>
        <n-button
          ghost
          size="small"
          type="primary"
          @click="handleDownload"
          :disabled="!(formModel.accessToken && formModel.gistId)"
        >
          <template #icon>
            <n-icon size="14" :component="CloudDownload" />
          </template>
          {{ ft("download-remote") }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="tsx">
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { FormInst, useMessage } from "naive-ui"
import syncManager from "@/sync/syncManager.ts"
import { LogoGithub } from "@vicons/ionicons5"
import { CloudDownload, CloudUpload } from "@vicons/carbon"
import { debounce } from "lodash-es"
import { useSpacesStore } from "@/store/spaces.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import { SYNC_TYPE, SYNC_GIST_TOKEN, SYNC_GIST_ID } from "@/utils/constants.ts"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"

const { ft } = useHelpi18n()
const show = defineModel<boolean>("show", { required: true })
const spacesStore = useSpacesStore()
const { refreshSpaces, refreshCollections } = useRefresh()
const syncTypeOptions = ref([
  { label: "GitHub", value: "github" },
  { label: "Gitee", value: "gitee" },
])
const formModel = ref({
  syncType: "github",
  gistId: "",
  accessToken: "",
})
const rules = ref({
  accessToken: [{ required: true, message: "AccessToken is required" }],
})
const formRef = ref<FormInst | null>(null)
const message = useMessage()
const { open } = useDeleteDialog()

const renderLabel = (option: any) => {
  return (
    <div class="flex items-center">
      {option.value === "gitee" ? (
        <gitee size="14" />
      ) : (
        <n-icon size="14" component={LogoGithub} />
      )}
      <span class="ml-1">{option.label}</span>
    </div>
  )
}

const handleSyncTypeChange = (value: string) => {
  if (value === formModel.value.syncType) return
  console.log("value: ", value, formModel.value.syncType)
  // type
  chrome.storage.sync.set({ [SYNC_TYPE]: value })
  formModel.value.syncType = value
  localStorage.setItem(SYNC_TYPE, value)
  syncManager.setEnv(SYNC_TYPE, value)

  // 清空accessToken
  formModel.value.accessToken = ""
  localStorage.setItem(SYNC_GIST_TOKEN, "")
  syncManager.setEnv(SYNC_GIST_TOKEN, "")
  chrome.storage.sync.set({ [SYNC_GIST_TOKEN]: "" })

  // 清空gistId
  formModel.value.gistId = ""
  localStorage.setItem(SYNC_GIST_ID, "")
  syncManager.setEnv(SYNC_GIST_ID, "")
  chrome.storage.sync.set({ [SYNC_GIST_ID]: "" })
}

const handleAccessTokenChange = debounce((value: string) => {
  localStorage.setItem(SYNC_GIST_TOKEN, value)
  syncManager.setEnv(SYNC_GIST_TOKEN, value)
  chrome.storage.sync.set({ [SYNC_GIST_TOKEN]: value })
}, 1000)

const handleGistIdChange = debounce((value: string) => {
  localStorage.setItem(SYNC_GIST_ID, value)
  syncManager.setEnv(SYNC_GIST_ID, value)
  chrome.storage.sync.set({ [SYNC_GIST_ID]: value })
}, 1000)

const handleUpload = () => {
  formRef.value?.validate().then(async () => {
    try {
      const gistId = await syncManager.uploadAll()
      formModel.value.gistId = gistId as string
      localStorage.setItem(SYNC_GIST_ID, gistId as string)
      await chrome.storage.sync.set({
        [SYNC_GIST_TOKEN]: formModel.value.accessToken,
        [SYNC_GIST_ID]: gistId as string,
      })
      message.success(ft("success", "upload"))
      show.value = false
    } catch (error) {
      message.error(ft("fail", "upload"))
    }
  })
}

const handleDownload = () => {
  open({
    title: ft("tips-title"),
    content: ft("download-remote-confirm"),
    onPositiveClick: () => {
      formRef.value?.validate().then(async () => {
        try {
          await syncManager.triggerDownload()
          await chrome.storage.sync.set({
            [SYNC_GIST_TOKEN]: formModel.value.accessToken,
            [SYNC_GIST_ID]: formModel.value.gistId,
          })
          await refreshSpaces()
          await spacesStore.setActiveSpace(spacesStore.spaces[0].id)
          await refreshCollections()
          message.success(ft("success", "download"))
          show.value = false
        } catch (error) {
          message.error(ft("fail", "download"))
        }
      })
    },
  })
}

watch(show, (value) => {
  if (value) {
    const accessToken = localStorage.getItem(SYNC_GIST_TOKEN)
    const gistId = localStorage.getItem(SYNC_GIST_ID)
    const syncType = localStorage.getItem(SYNC_TYPE)
    if (accessToken) {
      formModel.value.accessToken = accessToken
    }
    if (gistId) {
      formModel.value.gistId = gistId
    }
    if (syncType) {
      formModel.value.syncType = syncType
    }
  }
})
</script>
