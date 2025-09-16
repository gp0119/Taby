<template>
  <n-popover
    trigger="hover"
    placement="bottom"
    :show-arrow="false"
    style="padding: 0; width: 220px"
  >
    <template #trigger>
      <n-button
        tertiary
        :focusable="false"
        size="small"
        class="w-[28px] !shadow-btn-shadow"
      >
        <template #icon>
          <n-icon size="18" :component="EllipsisVerticalSharp" />
        </template>
      </n-button>
    </template>
    <template #default>
      <div class="flex flex-col overflow-hidden rounded-lg bg-dialog-color">
        <div class="flex flex-col">
          <ItemWrapper
            :icon="Settings"
            :title="ft('setting')"
            @click="show = true"
          />
          <ItemWrapper
            tag="a"
            href="https://github.com/gp0119/Taby/issues/new"
            target="_blank"
            :icon="Forum"
            :title="ft('feedback')"
          />
        </div>

        <div class="flex flex-col gap-y-3 border-t bg-hover-color px-4 py-2">
          <LangSwitch />
          <ThemeSwitch />
        </div>
      </div>
    </template>
  </n-popover>
  <SettingDrawer v-model:show="show" />
</template>

<script setup lang="tsx">
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { Forum } from "@vicons/carbon"
import LangSwitch from "./lang-switch.vue"
import ThemeSwitch from "./theme-switch.vue"
import { EllipsisVerticalSharp } from "@vicons/ionicons5"
import { Settings } from "@vicons/carbon"
import SettingDrawer from "./setting-drawer.vue"
import ItemWrapper from "./item-wrapper.vue"

const { ft } = useHelpi18n()
const show = ref(false)
</script>
