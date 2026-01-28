<template>
  <n-modal
    v-model:show="show"
    preset="dialog"
    title-class="[&_.n-base-icon]:hidden !text-text-primary"
    class="bg-card-color"
    :close-on-esc="false"
    :mask-closable="false"
    :auto-focus="false"
  >
    <template #header>
      <span class="mr-1 text-text-primary">{{ ft("sync-with-gist") }}</span>
      <PopoverWrapper trigger="hover" placement="top" style="max-width: 600px">
        <n-icon
          size="18"
          class="cursor-pointer text-primary"
          :component="Information"
        />
        <template #message>
          <ul class="list-inside list-disc text-justify text-xs">
            <li>{{ ft("sync-note-1") }}</li>
            <li>{{ ft("sync-note-2") }}</li>
            <li>{{ ft("sync-note-3") }}</li>
            <li>{{ ft("sync-note-4") }}</li>
          </ul>
        </template>
      </PopoverWrapper>
    </template>
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
      <n-form-item
        path="gistId"
        :label="`${ft('gist-id')}:`"
        :show-feedback="false"
      >
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
          :loading="uploadLoading"
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
          :loading="downloadLoading"
          :disabled="!(formModel.accessToken && formModel.gistId)"
          @click="handleDownload"
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
import { CloudDownload, CloudUpload, Information } from "@vicons/carbon"
import { debounce } from "lodash-es"
import { useRefresh } from "@/hooks/useRresh.ts"
import { SYNC_TYPE, SYNC_GIST_TOKEN, SYNC_GIST_ID } from "@/utils/constants.ts"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import Gitee from "@/components/gitee.vue"

const { ft } = useHelpi18n()
const show = defineModel<boolean>("show", { required: true })
const { refreshSpaces, refreshCollections, updateContextMenus } = useRefresh()
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

const uploadLoading = ref(false)
const downloadLoading = ref(false)
const renderLabel = (option: any) => {
  return (
    <div class="flex items-center">
      {option.value === "gitee" ? (
        <Gitee class="text-[14px]" />
      ) : (
        <n-icon size="14" component={LogoGithub} />
      )}
      <span class="ml-1">{option.label}</span>
    </div>
  )
}

const handleSyncTypeChange = (value: string) => {
  if (value === formModel.value.syncType) return
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
      uploadLoading.value = true
      const gistId = await syncManager.uploadAll()
      console.log("gistId: ", gistId)
      formModel.value.gistId = gistId as string
      localStorage.setItem(SYNC_GIST_ID, gistId as string)
      await chrome.storage.sync.set({
        [SYNC_GIST_TOKEN]: formModel.value.accessToken,
        [SYNC_GIST_ID]: gistId as string,
      })
      message.success(ft("success", "upload"))
      uploadLoading.value = false
      show.value = false
    } catch {
      message.error(ft("fail", "upload"))
      uploadLoading.value = false
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
          downloadLoading.value = true
          await syncManager.triggerDownload()
          await chrome.storage.sync.set({
            [SYNC_GIST_TOKEN]: formModel.value.accessToken,
            [SYNC_GIST_ID]: formModel.value.gistId,
          })
          await refreshSpaces()
          await refreshCollections()
          await updateContextMenus()
          message.success(ft("success", "download"))
          downloadLoading.value = false
          show.value = false
        } catch {
          message.error(ft("fail", "download"))
          downloadLoading.value = false
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
    if (syncType) {
      formModel.value.syncType = syncType
      syncManager.setEnv(SYNC_TYPE, syncType)
    }
    if (accessToken) {
      formModel.value.accessToken = accessToken
      syncManager.setEnv(SYNC_GIST_TOKEN, accessToken)
    }
    if (gistId) {
      formModel.value.gistId = gistId
      syncManager.setEnv(SYNC_GIST_ID, gistId)
    }
  }
})
</script>
