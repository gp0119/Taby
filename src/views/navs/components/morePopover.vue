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
          <a
            href="https://github.com/gp0119/Taby/issues/new"
            target="_blank"
            class="flex w-full items-center justify-between px-4 py-2 hover:bg-hover-color"
          >
            <div class="flex items-center gap-x-2">
              <n-icon-wrapper>
                <n-icon size="18" :component="Forum" />
              </n-icon-wrapper>
              <span>{{ ft("feedback") }}</span>
            </div>
            <n-icon
              size="20"
              class="text-text-primary"
              :component="ChevronForward"
            />
          </a>
        </div>

        <div class="flex flex-col gap-y-3 px-4 py-2">
          <LangSwitch />
          <ThemeSwitch />
        </div>
      </div>
    </template>
  </n-popover>
</template>

<script setup lang="tsx">
import { useHelpi18n } from "@/hooks/useHelpi18n.js"
import { Forum } from "@vicons/carbon"
import { ChevronForward } from "@vicons/ionicons5"
import { EllipsisVerticalSharp } from "@vicons/ionicons5"
import LangSwitch from "./lang-switch.vue"
import ThemeSwitch from "./theme-switch.vue"
const { ft } = useHelpi18n()
</script>
