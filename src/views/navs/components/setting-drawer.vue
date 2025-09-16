<template>
  <n-drawer
    v-model:show="show"
    :width="450"
    placement="right"
    :auto-focus="false"
  >
    <n-drawer-content header-class="bg-setting-color">
      <!-- 标题 -->
      <template #header>
        <div class="flex items-center justify-between">
          <span>{{ ft("setting") }}</span>
          <n-button
            quaternary
            size="small"
            class="w-[28px]"
            @click="show = false"
          >
            <template #icon>
              <n-icon size="18" :component="Close" />
            </template>
          </n-button>
        </div>
      </template>
      <div class="flex flex-col gap-y-4">
        <!-- 新窗口设置 -->
        <div
          class="rounded-lg border border-border-color bg-setting-card-color py-2"
        >
          <ItemWrapper
            :icon="Launch"
            :title="ft('open-in-new-window')"
            :hover="false"
          >
            <n-switch
              :value="settingStore.getSetting('openInNewWindow')"
              @update-value="settingStore.setSetting('openInNewWindow', $event)"
            />
          </ItemWrapper>
        </div>
        <!-- 按组打开 -->
        <div
          class="rounded-lg border border-border-color bg-setting-card-color py-2"
        >
          <ItemWrapper
            :icon="GroupResource"
            :title="ft('open-cards-in-group')"
            :hover="false"
          >
            <n-switch
              :value="settingStore.getSetting('openCardsInGroup')"
              @update-value="
                settingStore.setSetting('openCardsInGroup', $event)
              "
            />
          </ItemWrapper>
        </div>
        <!-- 操作后多久保存 -->
        <div
          class="rounded-lg border border-border-color bg-setting-card-color py-2"
        >
          <div
            class="flex w-full cursor-pointer flex-col justify-between gap-y-2 px-4 py-2"
          >
            <div class="flex select-none items-center gap-x-2">
              <n-button tertiary size="small" class="w-[28px]">
                <template #icon>
                  <n-icon size="18" :component="Timer" />
                </template>
              </n-button>
              <span>{{ ft("save-after-operation-time") }}</span>
            </div>
            <n-slider
              :min="1"
              :max="10"
              :value="settingStore.getSetting('saveAfterOperationTime')"
              :marks="marks"
              step="mark"
              @update-value="
                settingStore.setSetting('saveAfterOperationTime', $event)
              "
            />
          </div>
        </div>
        <!-- 隐藏右键菜单 -->
        <div
          class="rounded-lg border border-border-color bg-setting-card-color py-2"
        >
          <ItemWrapper
            :icon="AlignBoxMiddleCenter"
            :title="ft('hide-right-click-menu')"
            :hover="false"
          >
            <n-switch
              :value="settingStore.getSetting('hideRightClickMenu')"
              @update-value="
                settingStore.setSetting('hideRightClickMenu', $event)
              "
            />
          </ItemWrapper>
        </div>
        <!-- 快捷键设置 -->
        <div
          class="rounded-lg border border-border-color bg-setting-card-color py-2"
        >
          <div
            class="flex w-full cursor-pointer flex-col justify-between gap-y-2 px-4 py-2"
          >
            <div class="flex select-none items-center gap-x-2">
              <n-button tertiary size="small" class="w-[28px]">
                <template #icon>
                  <n-icon size="18" :component="Keyboard" />
                </template>
              </n-button>
              <span>{{ ft("shortcut-settings") }}</span>
              <PopoverWrapper
                :message="ft('shortcut-hint-recording-no-mod')"
                placement="top-start"
              >
                <n-icon :component="Information" size="14" />
              </PopoverWrapper>
            </div>
            <ShortcutItem
              v-for="item in shortcutList"
              :key="item.title"
              :title="item.title"
              :value="item.value"
              @update:value="onUpdateShortcut(item.key, $event)"
              @reset="onResetShortcut(item.key)"
              @clear="onClearShortcut(item.key)"
            />
          </div>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { useHelpi18n } from "@/hooks/useHelpi18n.js"
import { Close } from "@vicons/ionicons5"
import {
  Launch,
  Timer,
  AlignBoxMiddleCenter,
  GroupResource,
  Keyboard,
} from "@vicons/carbon"
import ItemWrapper from "./item-wrapper.vue"
import { useSettingStore } from "@/store/setting"
import ShortcutItem from "./shortcut-item.vue"
import { DEFAULT_SHORTCUT_SETTINGS } from "@/utils/constants"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { Information } from "@vicons/carbon"

const settingStore = useSettingStore()
const show = defineModel<boolean>("show", { required: true })
const { ft } = useHelpi18n()
const marks = {
  1: "1min",
  3: "3min",
  5: "5min",
  10: "10min",
}

type ShortcutKey =
  | "saveAllTabs"
  | "saveAllTabsAndClose"
  | "closeDuplicateTabs"
  | "closeAllTabs"
  | "globalSearch"

const shortcutList = computed(() => {
  console.log(
    'settingStore.getSetting("shortcutSettings"): ',
    settingStore.getSetting("shortcutSettings"),
  )
  return [
    {
      title: ft("save-all-tabs"),
      value: settingStore.getSetting("shortcutSettings")?.saveAllTabs,
      key: "saveAllTabs" as ShortcutKey,
    },
    {
      title: ft("save-all-tabs-and-close"),
      value: settingStore.getSetting("shortcutSettings")?.saveAllTabsAndClose,
      key: "saveAllTabsAndClose" as ShortcutKey,
    },
    {
      title: ft("close-duplicate-tabs"),
      value: settingStore.getSetting("shortcutSettings")?.closeDuplicateTabs,
      key: "closeDuplicateTabs" as ShortcutKey,
    },
    {
      title: ft("close-all-tabs"),
      value: settingStore.getSetting("shortcutSettings")?.closeAllTabs,
      key: "closeAllTabs" as ShortcutKey,
    },
    {
      title: ft("global-search"),
      value: settingStore.getSetting("shortcutSettings")?.globalSearch,
      key: "globalSearch" as ShortcutKey,
    },
    {
      title: ft("open-tag-filter"),
      value: settingStore.getSetting("shortcutSettings")?.openTagFilter,
      key: "openTagFilter" as ShortcutKey,
    },
  ]
})

const defaultShortcutSettings = { ...DEFAULT_SHORTCUT_SETTINGS }

const onUpdateShortcut = (key: ShortcutKey, value: string) => {
  const current =
    settingStore.getSetting("shortcutSettings") || defaultShortcutSettings
  settingStore.setSetting("shortcutSettings", {
    ...current,
    [key]: value,
  })
}

const onResetShortcut = (key: ShortcutKey) => {
  onUpdateShortcut(key, defaultShortcutSettings[key])
}

// 清空快捷键（支持“取消快捷键”功能）
const onClearShortcut = (key: ShortcutKey) => {
  onUpdateShortcut(key, "")
}
</script>
