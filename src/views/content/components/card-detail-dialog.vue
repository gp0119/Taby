<template>
  <n-modal v-model:show="show" :auto-focus="false">
    <div
      class="flex w-[520px] max-w-[calc(100vw-24px)] flex-col gap-y-4 rounded-xl bg-dialog-color p-5 shadow-card-shadow"
    >
      <div
        class="flex-center relative aspect-[1.91/1] overflow-hidden rounded-lg border border-solid bg-hover-color"
      >
        <img
          v-if="cover && !coverFailed"
          :src="cover"
          referrerpolicy="no-referrer"
          class="h-full w-full object-cover"
          @error="coverFailed = true"
        />
        <div v-else class="flex select-none flex-col items-center gap-y-3">
          <div
            class="cover-tint flex-center h-24 w-24 rounded-full text-text-secondary shadow-inner"
          >
            <n-icon
              size="44"
              class="opacity-60"
              :component="ImageOff24Regular"
            />
          </div>
          <span class="text-xs font-medium text-text-secondary">
            {{ ft("cover-not-found") }}
          </span>
        </div>
        <PopoverWrapper
          v-if="hasExtensionTabs()"
          :message="ft('refetch-cover')"
          placement="left"
        >
          <n-button
            secondary
            :focusable="false"
            :loading="fetchingCover"
            class="!absolute right-3 top-3 h-9 w-9"
            @click="onRefetchCover"
          >
            <template #icon>
              <n-icon size="18" :component="Renew" />
            </template>
          </n-button>
        </PopoverWrapper>
      </div>

      <div class="flex items-start gap-x-3">
        <n-popover
          v-model:show="showIconMenu"
          trigger="click"
          placement="bottom-start"
          :show-arrow="false"
          style="padding: 0"
          @update:show="showCustomInput = false"
        >
          <template #trigger>
            <n-button
              :focusable="false"
              :loading="refetching"
              class="group/icon mt-0.5 h-9 w-9 flex-shrink-0"
            >
              <template #icon>
                <Favicon :child="previewCard" class="group-hover/icon:hidden" />
                <n-icon
                  size="18"
                  class="hidden text-text-primary group-hover/icon:inline-flex"
                  :component="OverflowMenuVertical"
                />
              </template>
            </n-button>
          </template>
          <div class="flex w-[260px] flex-col gap-y-0.5 p-1.5">
            <div
              v-if="hasExtensionTabs()"
              class="icon-menu-item"
              @click="onRefetchFavicon"
            >
              <n-icon size="16" :component="Renew" />
              <span class="flex-1 truncate">{{ ft("refetch-favicon") }}</span>
            </div>
            <div
              class="icon-menu-item"
              @click="showCustomInput = !showCustomInput"
            >
              <n-icon size="16" :component="AddFilled" />
              <span class="flex-1 truncate">{{ ft("custom-favicon") }}</span>
              <n-icon
                size="14"
                class="transition-transform duration-200"
                :class="{ 'rotate-180': showCustomInput }"
                :component="ChevronDown"
              />
            </div>
            <div v-if="showCustomInput" class="px-2 pb-1.5 pt-1">
              <n-input
                v-model:value="formModel.favicon"
                size="small"
                autofocus
                clearable
                :placeholder="ft('placeholder', 'favicon')"
              />
              <div class="mt-1 text-xs text-text-secondary">
                {{ ft("favicon-tip") }}
              </div>
            </div>
          </div>
        </n-popover>

        <div class="flex min-w-0 flex-1 flex-col gap-y-1">
          <input
            v-model="formModel.title"
            class="detail-input text-lg font-bold"
            :placeholder="ft('placeholder', 'title')"
            @focus="selectAll"
            @mouseup="keepSelection"
          />
          <input
            v-model="formModel.url"
            class="detail-input text-xs !text-text-secondary"
            :class="{ '!border-error-color': urlError }"
            :placeholder="ft('placeholder', 'url')"
            @focus="selectAll"
            @mouseup="keepSelection"
            @blur="onUrlBlur"
          />
          <div v-if="urlError" class="px-2 text-xs text-error-color">
            {{ urlError }}
          </div>
          <textarea
            v-model="formModel.description"
            rows="2"
            class="detail-input resize-none text-sm [field-sizing:content]"
            :placeholder="ft('placeholder', 'description')"
            @focus="selectAll"
            @mouseup="keepSelection"
          />
        </div>
      </div>

      <div class="mt-6 flex items-center gap-x-3">
        <n-button tertiary :focusable="false" @click="onDelete">
          <template #icon>
            <n-icon size="16" :component="Delete" />
          </template>
        </n-button>
        <MovePopover type="card" placement="top-start" @select="onMove">
          <n-button tertiary class="mr-auto">
            <template #icon>
              <n-icon size="16" :component="FolderMoveTo" />
            </template>
            {{ ft("move-to") }}
          </n-button>
        </MovePopover>
        <n-button tertiary @click="show = false">
          {{ ft("cancel") }}
        </n-button>
        <n-button type="primary" :disabled="!!urlError" @click="onSave">
          {{ ft("save") }}
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="tsx">
import dataManager from "@/db"
import { Card as iCard, movePosition } from "@/type.ts"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import Favicon from "@/components/favicon.vue"
import MovePopover from "@/components/move-popover.vue"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import {
  AddFilled,
  ChevronDown,
  Delete,
  FolderMoveTo,
  OverflowMenuVertical,
  Renew,
} from "@vicons/carbon"
import { ImageOff24Regular } from "@vicons/fluent"
import { useMessage } from "naive-ui"
import { useLocalStorage } from "@vueuse/core"
import { getDomain } from "@/utils"
import { hasExtensionTabs, isWeb } from "@/utils/platform"
import { getSafeCardUrl, getSafeWebUrl } from "@/utils/web"

const FAVICON_TIMEOUT_MS = 15000
const COVER_TIMEOUT_MS = 10000

const props = defineProps<{
  card: iCard
}>()

const show = defineModel<boolean>("show", { default: false })

const { ft } = useHelpi18n()
const message = useMessage()
const { open: openDeleteDialog } = useDeleteDialog()

const formModel = ref({
  title: "",
  description: "",
  favicon: undefined as string | undefined,
  url: "",
})
const showIconMenu = ref(false)
const showCustomInput = ref(false)
const refetching = ref(false)
const cover = ref<string>()
// debt: 缓存不设上限也不过期，条目过多或需要更新分享图时再加 LRU/过期时间
const coverCache = useLocalStorage<Record<string, string>>("cover-cache", {})
const fetchingCover = ref(false)
const coverFailed = ref(false)

const safeUrl = computed(() =>
  (isWeb ? getSafeWebUrl : getSafeCardUrl)(formModel.value.url),
)
const urlError = computed(() => (safeUrl.value ? undefined : ft("invalid-url")))

const previewCard = computed(() => ({
  ...props.card,
  url: formModel.value.url,
  favicon: formModel.value.favicon,
}))

let justFocused = false

function selectAll(e: FocusEvent) {
  ;(e.target as HTMLInputElement | HTMLTextAreaElement).select()
  justFocused = true
}

// 点击聚焦后浏览器会在 mouseup 时取消 select() 的选中
function keepSelection(e: MouseEvent) {
  if (!justFocused) return
  justFocused = false
  e.preventDefault()
}

function onUrlBlur() {
  if (urlError.value) return
  if (getDomain(props.card.url) !== getDomain(formModel.value.url)) {
    formModel.value.favicon = undefined
  }
}

function waitForFavicon(tabId: number) {
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(ft("fail", "refetch-favicon")))
    }, FAVICON_TIMEOUT_MS)
    function listener(
      updatedTabId: number,
      changeInfo: chrome.tabs.OnUpdatedInfo,
    ) {
      if (updatedTabId !== tabId || !changeInfo.favIconUrl) return
      cleanup()
      resolve(changeInfo.favIconUrl)
    }
    function cleanup() {
      clearTimeout(timer)
      chrome.tabs.onUpdated.removeListener(listener)
    }
    chrome.tabs.onUpdated.addListener(listener)
  })
}

async function onRefetchFavicon() {
  showIconMenu.value = false
  if (!safeUrl.value) {
    message.error(ft("invalid-url"))
    return
  }
  const cardId = props.card.id
  refetching.value = true
  const tab = await chrome.tabs.create({ url: safeUrl.value, active: false })
  try {
    const favicon = await waitForFavicon(tab.id!)
    await dataManager.updateCardFavicon(cardId, favicon)
    if (cardId === props.card.id) formModel.value.favicon = favicon
  } catch (error) {
    message.error((error as Error).message)
  } finally {
    chrome.tabs.remove(tab.id!)
    refetching.value = false
  }
}

async function fetchCover(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(COVER_TIMEOUT_MS),
  })
  const doc = new DOMParser().parseFromString(
    await response.text(),
    "text/html",
  )
  const image = doc.querySelector<HTMLMetaElement>(
    'meta[property="og:image"], meta[name="twitter:image"]',
  )?.content
  return image ? new URL(image, response.url).href : undefined
}

async function onRefetchCover() {
  const url = safeUrl.value
  if (!url) {
    message.error(ft("invalid-url"))
    return
  }
  fetchingCover.value = true
  try {
    const image = await fetchCover(url)
    coverCache.value[url] = image ?? ""
    if (url !== safeUrl.value) return
    if (image) cover.value = image
    else message.warning(ft("cover-not-found"))
  } catch {
    message.error(ft("fail", "refetch-cover"))
  } finally {
    fetchingCover.value = false
  }
}

watch(
  show,
  (value) => {
    if (!value) return
    const { title, description, favicon, url } = props.card
    formModel.value = { title, description, favicon, url }
    cover.value =
      (safeUrl.value && coverCache.value[safeUrl.value]) || undefined
  },
  { immediate: true },
)

watch(cover, () => (coverFailed.value = false))

function onDelete() {
  openDeleteDialog({
    title: ft("delete", "card"),
    content: () => (
      <span class="text-text-primary">
        {ft("delete-confirm-prefix")}
        <span class="text-primary">{props.card.title}</span>
        {ft("delete-confirm-suffix")}
      </span>
    ),
    onPositiveClick: async () => {
      await dataManager.removeCard(props.card.id)
      show.value = false
    },
  })
}

async function onMove(collectionId: number, position: movePosition) {
  await dataManager.batchUpdateCards(
    [props.card.id],
    { collectionId },
    position,
  )
  show.value = false
}

async function onSave() {
  if (urlError.value) return
  let faviconId
  if (formModel.value.favicon) {
    faviconId = await dataManager.addFavicon(formModel.value.favicon)
  }
  await dataManager.updateCard(props.card.id, {
    title: formModel.value.title,
    description: formModel.value.description,
    faviconId,
    url: formModel.value.url,
  })
  show.value = false
}
</script>

<style scoped>
.detail-input {
  @apply w-full rounded-md border border-solid border-transparent bg-transparent px-2 py-1 text-text-primary outline-none transition-colors duration-200 hover:bg-hover-color focus:border-primary;
}
.cover-tint {
  background: color-mix(in srgb, var(--textSecondary) 8%, transparent);
}
.icon-menu-item {
  @apply flex min-h-[34px] cursor-pointer select-none items-center gap-x-2 rounded-md px-2 py-1 text-text-primary transition-colors duration-200 hover:bg-hover-color;
}
</style>
