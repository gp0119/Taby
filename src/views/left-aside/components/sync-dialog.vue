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
      <span class="mr-1 text-text-primary">{{ ft("sync-settings") }}</span>
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

    <n-form ref="formRef" :model="formModel" require-mark-placement="left">
      <n-form-item :label="`${ft('primary-sync')}:`" path="syncType">
        <n-select
          :value="formModel.syncType"
          :options="syncTypeOptions"
          :render-label="renderLabel"
          @update:value="handleSyncTypeChange"
        />
      </n-form-item>

      <n-collapse
        v-model:expanded-names="expandedBackupTypes"
        arrow-placement="right"
        :trigger-areas="['arrow', 'main']"
      >
        <SyncConfigSection
          v-for="type in configTypes"
          :key="type"
          :name="type"
          :primary="type === formModel.syncType"
          :disabled="!formModel.backupTypes.includes(type)"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <span @click.stop>
                <n-checkbox
                  :checked="formModel.backupTypes.includes(type)"
                  @update:checked="
                    (checked: boolean) => handleBackupTypeChange(type, checked)
                  "
                />
              </span>
              <span>{{ getSyncLabel(type) }}</span>
            </div>
          </template>

          <template v-if="type === 'webdav'">
            <n-form-item
              :label="`${ft('webdav-host')}:`"
              path="webdav.host"
              :rule="{
                required: true,
                message: 'WebDAV Host is required',
                trigger: ['input', 'blur'],
              }"
            >
              <n-input-group>
                <n-select
                  v-model:value="formModel.webdav.protocol"
                  :options="webdavProtocolOptions"
                  class="!w-[150px]"
                />
                <n-input
                  v-model:value="formModel.webdav.host"
                  :placeholder="ft('webdav-host-placeholder')"
                />
                <n-input-group-label>:</n-input-group-label>
                <n-input
                  v-model:value="formModel.webdav.port"
                  class="!w-[120px]"
                  :placeholder="ft('webdav-port-placeholder')"
                />
              </n-input-group>
            </n-form-item>
            <n-form-item :label="`${ft('folder')}:`" path="webdav.folder">
              <n-input-group>
                <n-input
                  v-model:value="formModel.webdav.folder"
                  :placeholder="ft('webdav-folder-placeholder')"
                />
                <n-input-group-label>/</n-input-group-label>
                <n-input
                  v-model:value="formModel.webdav.filename"
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
            <n-form-item :label="`${ft('username')}:`" path="webdav.username">
              <n-input
                v-model:value="formModel.webdav.username"
                :input-props="{
                  name: 'username',
                  autocomplete: 'section-webdav username',
                }"
                :placeholder="ft('webdav-username-placeholder')"
              />
            </n-form-item>
            <n-form-item
              :label="`${ft('password')}:`"
              path="webdav.password"
              :show-feedback="false"
            >
              <n-input
                v-model:value="formModel.webdav.password"
                type="password"
                show-password-on="click"
                :input-props="{
                  name: 'password',
                  autocomplete: 'section-webdav current-password',
                }"
                :placeholder="ft('webdav-password-placeholder')"
              />
            </n-form-item>
          </template>

          <template v-else>
            <n-form-item
              class="pb-3"
              :path="`gist.${type}.gistId`"
              :label="ft('gist-id-label')"
              :show-feedback="false"
            >
              <n-input
                v-model:value="formModel.gist[type].gistId"
                :input-props="{
                  name: 'username',
                  autocomplete: `section-${type} username`,
                }"
                :placeholder="ft('placeholder', 'gist-id')"
              />
            </n-form-item>
            <n-form-item
              label-style="width: 100%"
              :path="`gist.${type}.accessToken`"
              :rule="{
                required: true,
                message: 'AccessToken is required',
                trigger: ['input', 'blur'],
              }"
            >
              <template #label>
                <a :href="getTokenUrl(type)" target="_blank">
                  <span class="text-blue-500">{{ ft("access-token") }}:</span>
                </a>
              </template>
              <n-input
                v-model:value="formModel.gist[type].accessToken"
                type="password"
                show-password-on="click"
                :input-props="{
                  name: 'password',
                  autocomplete: `section-${type} current-password`,
                }"
                :placeholder="ft('placeholder', 'access-token')"
              />
            </n-form-item>
          </template>

          <template v-if="type === formModel.syncType">
            <p class="mt-3 text-sm">{{ ft("backup-sync") }}:</p>
            <p class="mb-3 mt-1 text-xs text-text-secondary">
              {{ ft("backup-sync-note") }}
            </p>
          </template>
        </SyncConfigSection>
      </n-collapse>
    </n-form>

    <p v-if="isWeb" class="mt-3 text-xs text-text-secondary">
      {{ ft(hasWebdavTarget ? "webdav-cors-note" : "web-sync-storage-note") }}
    </p>

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
          {{
            ft(
              formModel.backupTypes.length
                ? "upload-and-backup"
                : "upload-local",
            )
          }}
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
import { NCollapseItem, useMessage } from "naive-ui"
import type { FormInst } from "naive-ui"
import { defineComponent, h } from "vue"
import syncManager, {
  SyncConflictCancelledError,
  SyncConflictResolvedRemoteError,
} from "@/sync/syncManager.ts"
import type { SyncOperationResult } from "@/sync/syncManager.ts"
import type { SyncTarget, SyncTargets } from "@/sync/syncProvider.ts"
import { persistCreatedGist, persistSyncValues } from "@/sync/syncProvider.ts"
import {
  getBackupProviderTypes,
  getGistCapability,
  getGistConfig,
  getGistConfigValues,
  getSyncProviderType,
  normalizeBackupProviderTypes,
} from "@/sync/syncConfig.ts"
import type {
  GistConfig,
  GistProviderType,
  SyncProviderType,
} from "@/sync/syncConfig.ts"
import { createGistManager } from "@/sync/gistManager.ts"
import { createWebdavManager } from "@/sync/webdavManager.ts"
import { LogoGithub, CloudCircle } from "@vicons/ionicons5"
import { CloudDownload, CloudUpload, Information } from "@vicons/carbon"
import { useRefresh } from "@/hooks/useRresh.ts"
import {
  SYNC_BACKUP_TYPES,
  SYNC_CONFIG_VERSION,
  SYNC_TYPE,
  SYNC_WEBDAV_PASSWORD,
  SYNC_WEBDAV_USERNAME,
} from "@/utils/constants.ts"
import {
  buildWebdavUrl,
  getWebdavConfig,
  getWebdavConfigValues,
  testWebdavConnection,
} from "@/sync/webdavConfig.ts"
import type { WebdavProtocol } from "@/sync/webdavConfig.ts"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import Gitee from "@/components/gitee.vue"
import { isWeb } from "@/utils/platform"
import { useLocalStorage } from "@vueuse/core"

const { ft, ft2 } = useHelpi18n()
const show = defineModel<boolean>("show", { required: true })
const { updateContextMenus } = useRefresh()
const message = useMessage()
const { open } = useDeleteDialog()
const formRef = ref<FormInst | null>(null)

const SyncConfigSection = defineComponent({
  props: {
    name: { type: String, required: true },
    primary: Boolean,
    disabled: Boolean,
  },
  setup(props, { slots }) {
    return () =>
      props.primary
        ? h("div", slots.default?.())
        : h(
            NCollapseItem,
            { name: props.name, disabled: props.disabled },
            slots,
          )
  },
})

const syncTypeOptions = [
  { label: "GitHub", value: "github" },
  { label: "Gitee", value: "gitee" },
  { label: "WebDAV", value: "webdav" },
] satisfies Array<{ label: string; value: SyncProviderType }>
const webdavProtocolOptions = [
  { label: "http", value: "http" },
  { label: "https", value: "https" },
]
const formModel = ref({
  syncType: "github" as SyncProviderType,
  backupTypes: [] as SyncProviderType[],
  gist: {
    github: { type: "github", gistId: "", accessToken: "" },
    gitee: { type: "gitee", gistId: "", accessToken: "" },
  } satisfies Record<GistProviderType, GistConfig>,
  webdav: {
    protocol: "https" as WebdavProtocol,
    host: "",
    port: "",
    folder: "",
    filename: "taby-sync.json",
    username: "",
    password: "",
  },
})

const uploadLoading = ref(false)
const downloadLoading = ref(false)
const testLoading = ref(false)
const expandedBackupTypes = useLocalStorage<SyncProviderType[]>(
  "syncExpandedBackupTypes",
  [],
)
const backupTypeOptions = computed(() =>
  syncTypeOptions.filter((option) => option.value !== formModel.value.syncType),
)
const configTypes = computed<SyncProviderType[]>(() => [
  formModel.value.syncType,
  ...backupTypeOptions.value.map((option) => option.value),
])
const activeTypes = computed<SyncProviderType[]>(() => [
  formModel.value.syncType,
  ...formModel.value.backupTypes.filter(
    (type) => type !== formModel.value.syncType,
  ),
])
const hasWebdavTarget = computed(() => activeTypes.value.includes("webdav"))

const getSyncLabel = (value: SyncProviderType) => {
  return syncTypeOptions.find((item) => item.value === value)?.label || "GitHub"
}

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

const getTokenUrl = (type: GistProviderType) =>
  type === "github"
    ? "https://github.com/settings/tokens"
    : "https://gitee.com/personal_access_tokens"

const currentWebdavConfig = () => ({
  protocol: formModel.value.webdav.protocol,
  host: formModel.value.webdav.host,
  port: formModel.value.webdav.port,
  folder: formModel.value.webdav.folder,
  filename: formModel.value.webdav.filename,
})

const hasPrimaryTargetChanged = () => {
  const previousType = getSyncProviderType()
  if (previousType !== formModel.value.syncType) return true
  if (formModel.value.syncType === "webdav") {
    return (
      buildWebdavUrl(getWebdavConfig()) !==
        buildWebdavUrl(currentWebdavConfig()) ||
      (localStorage.getItem(SYNC_WEBDAV_USERNAME) || "") !==
        formModel.value.webdav.username
    )
  }
  return (
    getGistConfig(formModel.value.syncType).gistId !==
    formModel.value.gist[formModel.value.syncType].gistId
  )
}

const isTypeConfigured = (type: SyncProviderType) =>
  type === "webdav"
    ? !!formModel.value.webdav.host.trim()
    : getGistCapability(formModel.value.gist[type]).canUpload

const createTarget = (
  type: SyncProviderType,
  targetChanged = false,
): SyncTarget => {
  if (type === "webdav") {
    const hasConfig = isTypeConfigured(type)
    return {
      type,
      provider: createWebdavManager(currentWebdavConfig(), {
        username: formModel.value.webdav.username,
        password: formModel.value.webdav.password,
      }),
      canUpload: hasConfig,
      canDownload: hasConfig,
      targetChanged,
    }
  }
  const config = formModel.value.gist[type]
  return {
    type,
    provider: createGistManager(
      config,
      async (gistId) => {
        formModel.value.gist[type].gistId = gistId
        await persistCreatedGist(config, gistId)
      },
      targetChanged,
    ),
    ...getGistCapability(config),
    targetChanged,
  }
}

const currentTargets = (): SyncTargets => ({
  primary: createTarget(formModel.value.syncType, hasPrimaryTargetChanged()),
  backups: formModel.value.backupTypes.map((type) => createTarget(type)),
})

const primaryTarget = computed(() => createTarget(formModel.value.syncType))
const canUpload = computed(() => primaryTarget.value.canUpload)
const canDownload = computed(() => primaryTarget.value.canDownload)
const canTestWebdav = computed(() => !!formModel.value.webdav.host.trim())

const isSyncProviderType = (value: unknown): value is SyncProviderType =>
  value === "github" || value === "gitee" || value === "webdav"

const handleSyncTypeChange = (value: unknown) => {
  if (!isSyncProviderType(value)) return
  if (value === formModel.value.syncType) return
  formModel.value.syncType = value
  formModel.value.backupTypes = formModel.value.backupTypes.filter(
    (type) => type !== value,
  )
  expandedBackupTypes.value = expandedBackupTypes.value.filter((type) =>
    formModel.value.backupTypes.includes(type),
  )
}

const handleBackupTypeChange = (type: SyncProviderType, checked: boolean) => {
  formModel.value.backupTypes = normalizeBackupProviderTypes(
    checked
      ? [...formModel.value.backupTypes, type]
      : formModel.value.backupTypes.filter((value) => value !== type),
    formModel.value.syncType,
  )
  expandedBackupTypes.value = checked
    ? normalizeBackupProviderTypes(
        [...expandedBackupTypes.value, type],
        formModel.value.syncType,
      )
    : expandedBackupTypes.value.filter((value) => value !== type)
}

const formatErrorMessage = (fallback: string, err: unknown) => {
  const suffix =
    isWeb && formModel.value.syncType === "webdav"
      ? ` ${ft("webdav-cors-note")}`
      : ""
  if (err instanceof Error && err.message) {
    return `${fallback}: ${err.message}${suffix}`
  }
  return `${fallback}${suffix}`
}

const applyTargetIds = (result: SyncOperationResult) => {
  if (formModel.value.syncType !== "webdav" && result.primaryTargetId) {
    formModel.value.gist[formModel.value.syncType].gistId =
      result.primaryTargetId
  }
  result.backups.forEach((backup) => {
    if (backup.success && backup.type !== "webdav" && backup.targetId) {
      formModel.value.gist[backup.type].gistId = backup.targetId
    }
  })
}

const getProviderValues = (type: SyncProviderType) => {
  if (type === "webdav") {
    return {
      ...getWebdavConfigValues(currentWebdavConfig()),
      [SYNC_WEBDAV_USERNAME]: formModel.value.webdav.username,
      [SYNC_WEBDAV_PASSWORD]: formModel.value.webdav.password,
    }
  }
  return getGistConfigValues(
    formModel.value.gist[type],
    formModel.value.syncType,
  )
}

const persistSuccessfulConfig = async (result: SyncOperationResult) => {
  applyTargetIds(result)
  const previousBackups = getBackupProviderTypes()
  const successfulBackups = new Set(
    result.backups
      .filter((backup) => backup.success)
      .map((backup) => backup.type),
  )
  const savedBackups = formModel.value.backupTypes.filter(
    (type) => successfulBackups.has(type) || previousBackups.includes(type),
  )
  const values: Record<string, string> = {
    [SYNC_CONFIG_VERSION]: "2",
    [SYNC_TYPE]: formModel.value.syncType,
    [SYNC_BACKUP_TYPES]: JSON.stringify(savedBackups),
    ...getProviderValues(formModel.value.syncType),
  }
  successfulBackups.forEach((type) => {
    Object.assign(values, getProviderValues(type))
  })
  await persistSyncValues(values)
}

const finishSuccessfulOperation = (
  operation: "upload" | "download",
  result: SyncOperationResult,
) => {
  message.success(ft("success", operation))
  const failedTypes = result.backups
    .filter((backup) => !backup.success)
    .map((backup) => getSyncLabel(backup.type))
  if (failedTypes.length) {
    message.warning(
      ft2("backup-sync-failed", { types: failedTypes.join(", ") }),
    )
  } else {
    show.value = false
  }
}

const validateForm = async () => {
  // 折叠的面板不会渲染表单项，其 required 规则也不会注册。
  // 先展开缺少凭据的目标，保证校验覆盖所有已启用的同步。
  const missingTypes = activeTypes.value.filter(
    (type) => !isTypeConfigured(type),
  )
  if (missingTypes.length) {
    expandedBackupTypes.value = normalizeBackupProviderTypes(
      [...expandedBackupTypes.value, ...missingTypes],
      formModel.value.syncType,
    )
    await nextTick()
  }
  try {
    await formRef.value?.validate()
    return true
  } catch {
    return false
  }
}

const handleTestWebdav = async () => {
  try {
    testLoading.value = true
    await testWebdavConnection(currentWebdavConfig(), {
      username: formModel.value.webdav.username,
      password: formModel.value.webdav.password,
    })
    message.success(ft("test-connection-success"))
  } catch (err) {
    message.error(formatErrorMessage(ft("test-connection-fail"), err))
  } finally {
    testLoading.value = false
  }
}

const handleUpload = async () => {
  if (!(await validateForm())) return
  try {
    uploadLoading.value = true
    const result = await syncManager.uploadAll(currentTargets())
    await persistSuccessfulConfig(result)
    finishSuccessfulOperation("upload", result)
  } catch (err) {
    if (err instanceof SyncConflictResolvedRemoteError) {
      await persistSuccessfulConfig(err.result)
      finishSuccessfulOperation("download", err.result)
    } else if (err instanceof SyncConflictCancelledError) {
      message.info("已取消上传")
    } else {
      message.error(formatErrorMessage(ft("fail", "upload"), err))
    }
  } finally {
    uploadLoading.value = false
  }
}

const handleDownload = async () => {
  if (!(await validateForm())) return
  open({
    title: ft("tips-title"),
    content: ft("download-remote-confirm"),
    onPositiveClick: async () => {
      try {
        downloadLoading.value = true
        const result = await syncManager.triggerDownload({
          allowEmpty: true,
          targets: currentTargets(),
        })
        await persistSuccessfulConfig(result)
        await updateContextMenus()
        finishSuccessfulOperation("download", result)
      } catch (err) {
        message.error(formatErrorMessage(ft("fail", "download"), err))
      } finally {
        downloadLoading.value = false
      }
    },
  })
}

watch(show, (value) => {
  if (!value) return
  formModel.value.syncType = getSyncProviderType()
  formModel.value.backupTypes = getBackupProviderTypes()
  expandedBackupTypes.value = expandedBackupTypes.value.filter((type) =>
    formModel.value.backupTypes.includes(type),
  )
  formModel.value.gist.github = getGistConfig("github")
  formModel.value.gist.gitee = getGistConfig("gitee")
  const webdavConfig = getWebdavConfig()
  formModel.value.webdav = {
    ...webdavConfig,
    username: localStorage.getItem(SYNC_WEBDAV_USERNAME) || "",
    password: localStorage.getItem(SYNC_WEBDAV_PASSWORD) || "",
  }
})
</script>
