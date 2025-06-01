<template>
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
      <ItemWrapper
        :icon="GroupResource"
        :title="ft('open-cards-in-group')"
        :hover="false"
      >
        <n-switch
          :value="settingStore.getSetting('openCardsInGroup')"
          @update-value="settingStore.setSetting('openCardsInGroup', $event)"
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
          @update-value="settingStore.setSetting('hideRightClickMenu', $event)"
        />
      </ItemWrapper>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Launch,
  Timer,
  AlignBoxMiddleCenter,
  GroupResource,
} from "@vicons/carbon"
import ItemWrapper from "./item-wrapper.vue"
import { useSettingStore } from "@/store/setting"
import { useHelpi18n } from "@/hooks/useHelpi18n.js"

const settingStore = useSettingStore()
const { ft } = useHelpi18n()
const marks = {
  1: "1min",
  3: "3min",
  5: "5min",
  10: "10min",
}
</script>
