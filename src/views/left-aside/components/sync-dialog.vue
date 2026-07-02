<template>
  <n-modal
    v-model:show="show"
    preset="dialog"
    title-class="[&_.n-base-icon]:hidden !text-text-primary"
    class="min-w-[550px] bg-card-color"
    :close-on-esc="false"
    :mask-closable="false"
    :auto-focus="false"
  >
    <template #header>
      <span class="mr-1 text-text-primary">{{ syncTitle }}</span>
      <PopoverWrapper
        v-if="!isWebdav"
        trigger="hover"
        placement="top"
        style="max-width: 600px"
      >
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
      <template v-if="isWebdav">
        <n-form-item :label="`${ft('webdav-host')}:`" path="webdavHost">
          <n-input-group>
            <n-select
              v-model:value="formModel.webdavProtocol"
              :options="webdavProtocolOptions"
              class="!w-[150px]"
            />
            <n-input
              v-model:value="formModel.webdavHost"
              :placeholder="ft('webdav-host-placeholder')"
            />
            <n-input-group-label>:</n-input-group-label>
            <n-input
              v-model:value="formModel.webdavPort"
              class="!w-[120px]"
              :placeholder="ft('webdav-port-placeholder')"
            />
          </n-input-group>
        </n-form-item>
        <n-form-item :label="`${ft('folder')}:`" path="webdavFolder">
          <n-input-group>
            <n-input
              v-model:value="formModel.webdavFolder"
              :placeholder="ft('webdav-folder-placeholder')"
            />
            <n-input-group-label>/</n-input-group-label>
            <n-input
              v-model:value="formModel.webdavFilename"
              class="!w-[250px]"
              :placeholder="ft('webdav-filename-placeholder')"
            />
            <n-button
              ghost
              type="primary"
              :loading="testLoading"
              :disabled="!canTestWebdav"
              @click="handleTestWebdav"
            >
              {{ ft("test-connection") }}
            </n-button>
          </n-input-group>
        </n-form-item>
        <n-form-item :label="`${ft('username')}:`" path="webdavUsername">
          <n-input
            v-model:value="formModel.webdavUsername"
            :placeholder="ft('webdav-username-placeholder')"
          />
        </n-form-item>
        <n-form-item
          :label="`${ft('password')}:`"
          path="webdavPassword"
          :show-feedback="false"
        >
          <n-input
            v-model:value="formModel.webdavPassword"
            type="password"
            show-password-on="click"
            :placeholder="ft('webdav-password-placeholder')"
          />
        </n-form-item>
      </template>
      <template v-else>
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
          />
        </n-form-item>
      </template>
    </n-form>
    <template #action>
      <div class="flex justify-end gap-2">
        <n-button
          type="primary"
          size="small"
          :disabled="!canUpload"
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
          :disabled="!canDownload"
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
import syncManager, {
  SyncConflictCancelledError,
  SyncConflictResolvedRemoteError,
} from "@/sync/syncManager.ts"
import { LogoGithub, CloudCircle } from "@vicons/ionicons5"
import { CloudDownload, CloudUpload, Information } from "@vicons/carbon"
import { useRefresh } from "@/hooks/useRresh.ts"
import {
  SYNC_GIST_ID,
  SYNC_GIST_TOKEN,
  SYNC_TYPE,
  SYNC_WEBDAV_FILENAME,
  SYNC_WEBDAV_PASSWORD,
  SYNC_WEBDAV_USERNAME,
} from "@/utils/constants.ts"
import {
  buildWebdavUrl,
  getWebdavConfig,
  persistWebdavConfig,
  testWebdavConnection,
} from "@/sync/webdavConfig.ts"
import type { WebdavProtocol } from "@/sync/webdavConfig.ts"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import Gitee from "@/components/gitee.vue"

const { ft, ft2 } = useHelpi18n()
const show = defineModel<boolean>("show", { required: true })
const { updateContextMenus } = useRefresh()
const syncTypeOptions = ref([
  { label: "GitHub", value: "github" },
  { label: "Gitee", value: "gitee" },
  { label: "WebDAV", value: "webdav" },
])
const webdavProtocolOptions = ref([
  { label: "http", value: "http" },
  { label: "https", value: "https" },
])
const formModel = ref({
  syncType: "github",
  gistId: "",
  accessToken: "",
  webdavProtocol: "https" as WebdavProtocol,
  webdavHost: "",
  webdavPort: "",
  webdavFolder: "",
  webdavFilename: "taby-sync.json",
  webdavUsername: "",
  webdavPassword: "",
})
const isWebdav = computed(() => formModel.value.syncType === "webdav")
const getSyncLabel = (value: string) => {
  return (
    syncTypeOptions.value.find((item) => item.value === value)?.label || "GitHub"
  )
}
const selectedSyncLabel = computed(() => {
  return getSyncLabel(formModel.value.syncType)
})
const syncTitle = computed(() =>
  ft2("sync-with", { type: selectedSyncLabel.value }),
)
const rules = computed(() => ({
  accessToken: isWebdav.value
    ? []
    : [{ required: true, message: "AccessToken is required" }],
  webdavHost: isWebdav.value
    ? [{ required: true, message: "WebDAV Host is required" }]
    : [],
}))
const formRef = ref<FormInst | null>(null)
const message = useMessage()
const { open } = useDeleteDialog()

const uploadLoading = ref(false)
const downloadLoading = ref(false)
const testLoading = ref(false)
const canUpload = computed(() => {
  return isWebdav.value
    ? !!formModel.value.webdavHost.trim()
    : !!formModel.value.accessToken
})
const canDownload = computed(() => {
  return isWebdav.value
    ? !!formModel.value.webdavHost.trim()
    : !!(formModel.value.accessToken && formModel.value.gistId)
})
const canTestWebdav = computed(() => {
  return !!formModel.value.webdavHost.trim()
})

const renderLabel = (option: any) => {
  return (
    <div class="flex items-center">
      {option.value === "webdav" ? (
        <n-icon size="16" component={CloudCircle} />
      ) : option.value === "gitee" ? (
        <Gitee class="text-[14px]" />
      ) : (
        <n-icon size="14" component={LogoGithub} />
      )}
      <span class="ml-1">{option.label}</span>
    </div>
  )
}

const currentWebdavConfig = () => ({
  protocol: formModel.value.webdavProtocol,
  host: formModel.value.webdavHost,
  port: formModel.value.webdavPort,
  folder: formModel.value.webdavFolder,
  filename: formModel.value.webdavFilename,
})

const handleSyncTypeChange = (value: string) => {
  if (value === formModel.value.syncType) return

  formModel.value.syncType = value
}

const hasSyncTargetChanged = () => {
  const previousType = localStorage.getItem(SYNC_TYPE) || "github"
  if (previousType !== formModel.value.syncType) return true

  if (formModel.value.syncType === "webdav") {
    const previousUrl = buildWebdavUrl(getWebdavConfig())
    const currentUrl = buildWebdavUrl(currentWebdavConfig())
    return (
      previousUrl !== currentUrl ||
      (localStorage.getItem(SYNC_WEBDAV_USERNAME) || "") !==
        formModel.value.webdavUsername
    )
  }

  return (localStorage.getItem(SYNC_GIST_ID) || "") !== formModel.value.gistId
}

const persistCurrentConfig = async () => {
  const targetChanged = hasSyncTargetChanged()

  const webdavValues = persistWebdavConfig(currentWebdavConfig())
  const values = {
    [SYNC_TYPE]: formModel.value.syncType,
    [SYNC_GIST_TOKEN]: formModel.value.accessToken,
    [SYNC_GIST_ID]: formModel.value.gistId,
    ...webdavValues,
    [SYNC_WEBDAV_USERNAME]: formModel.value.webdavUsername,
    [SYNC_WEBDAV_PASSWORD]: formModel.value.webdavPassword,
  }
  Object.entries(values).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })
  await chrome.storage.sync.set(values)
  if (targetChanged) {
    await syncManager.resetSyncTargetState()
  }
}

const handleTestWebdav = async () => {
  try {
    testLoading.value = true
    await testWebdavConnection(currentWebdavConfig(), {
      username: formModel.value.webdavUsername,
      password: formModel.value.webdavPassword,
    })
    message.success(ft("test-connection-success"))
  } catch {
    message.error(ft("test-connection-fail"))
  } finally {
    testLoading.value = false
  }
}

const handleUpload = () => {
  formRef.value?.validate().then(async () => {
    try {
      uploadLoading.value = true
      await persistCurrentConfig()
      const targetId = await syncManager.uploadAll()
      if (!isWebdav.value) {
        formModel.value.gistId = targetId
        localStorage.setItem(SYNC_GIST_ID, targetId)
        await chrome.storage.sync.set({
          [SYNC_GIST_TOKEN]: formModel.value.accessToken,
          [SYNC_GIST_ID]: targetId,
        })
      }
      message.success(ft("success", "upload"))
      uploadLoading.value = false
      show.value = false
    } catch (err) {
      if (err instanceof SyncConflictResolvedRemoteError) {
        message.success(ft("success", "download"))
        show.value = false
      } else if (err instanceof SyncConflictCancelledError) {
        message.info("已取消上传")
      } else {
        message.error(ft("fail", "upload"))
      }
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
          await persistCurrentConfig()
          // 用户已通过确认对话框显式同意覆盖本地，允许 remote 为空时也照常下载
          await syncManager.triggerDownload({ allowEmpty: true })
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
    formModel.value.syncType = localStorage.getItem(SYNC_TYPE) || "github"
    formModel.value.accessToken = localStorage.getItem(SYNC_GIST_TOKEN) || ""
    formModel.value.gistId = localStorage.getItem(SYNC_GIST_ID) || ""
    const webdavConfig = getWebdavConfig()
    formModel.value.webdavProtocol = webdavConfig.protocol
    formModel.value.webdavHost = webdavConfig.host
    formModel.value.webdavPort = webdavConfig.port
    formModel.value.webdavFolder = webdavConfig.folder
    formModel.value.webdavFilename =
      localStorage.getItem(SYNC_WEBDAV_FILENAME) || webdavConfig.filename
    formModel.value.webdavUsername =
      localStorage.getItem(SYNC_WEBDAV_USERNAME) || ""
    formModel.value.webdavPassword =
      localStorage.getItem(SYNC_WEBDAV_PASSWORD) || ""
  }
})
</script>
