<template>
  <n-drawer
    v-model:show="show"
    :width="450"
    placement="right"
    :auto-focus="false"
  >
    <n-drawer-content header-class="bg-setting-color">
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
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { useHelpi18n } from "@/hooks/useHelpi18n.js"
import { Close } from "@vicons/ionicons5"
import { Launch, Timer, AlignBoxMiddleCenter } from "@vicons/carbon"
import ItemWrapper from "./item-wrapper.vue"
import { useSettingStore } from "@/store/setting"

const settingStore = useSettingStore()
const show = defineModel<boolean>("show", { required: true })
const { ft } = useHelpi18n()
const marks = {
  1: "1min",
  3: "3min",
  5: "5min",
  10: "10min",
}
</script>
