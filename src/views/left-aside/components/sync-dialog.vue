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
          v-model:value="formModel.syncType"
          :options="syncTypeOptions"
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
            <n-icon size="12" :component="LogoGithub" />
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
          {{ ft("upload-local") }}
        </n-button>
        <n-button size="small" @click="handleDownload">
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
import { debounce } from "lodash-es"
import { useSpacesStore } from "@/store/spaces.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import { SYNC_TYPE, SYNC_GIST_TOKEN, SYNC_GIST_ID } from "@/utils/constants.ts"

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
const handleSyncTypeChange = debounce((value: string) => {
  chrome.storage.sync.set({ [SYNC_TYPE]: value })
  localStorage.setItem(SYNC_TYPE, value)
  formModel.value.accessToken = ""
  formModel.value.gistId = ""
  localStorage.setItem(SYNC_GIST_TOKEN, "")
  localStorage.setItem(SYNC_GIST_ID, "")
}, 1000)
const handleAccessTokenChange = debounce((value: string) => {
  localStorage.setItem(SYNC_GIST_TOKEN, value)
}, 1000)
const handleGistIdChange = debounce((value: string) => {
  localStorage.setItem(SYNC_GIST_ID, value)
}, 1000)

const handleUpload = () => {
  formRef.value?.validate().then(async () => {
    try {
      await chrome.storage.sync.set({
        [SYNC_GIST_TOKEN]: formModel.value.accessToken,
      })
      const gistId = await syncManager.uploadNow()
      formModel.value.gistId = gistId as string
      message.success(ft("success", "upload"))
      show.value = false
    } catch (error) {
      message.error(ft("fail", "upload"))
    }
  })
}
const handleDownload = () => {
  formRef.value?.validate().then(async () => {
    try {
      formRef.value?.validate().then(async () => {
        await chrome.storage.sync.set({
          [SYNC_GIST_TOKEN]: formModel.value.accessToken,
          [SYNC_GIST_ID]: formModel.value.gistId,
        })
        await syncManager.triggerDownload()
        await refreshSpaces()
        await spacesStore.setActiveSpace(spacesStore.spaces[0].id)
        await refreshCollections()
        message.success(ft("success", "download"))
        show.value = false
      })
    } catch (error) {
      message.error(ft("fail", "download"))
    }
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
