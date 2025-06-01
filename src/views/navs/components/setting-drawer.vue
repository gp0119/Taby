<template>
  <n-drawer
    v-model:show="show"
    :width="450"
    placement="right"
    :auto-focus="false"
  >
    <n-drawer-content header-class="bg-setting-color !px-4 !pt-4 !pb-0">
      <template #header>
        <div class="flex items-center justify-between pb-2">
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
        <n-tabs v-model:value="activeTab" type="line">
          <n-tab name="general">General</n-tab>
          <n-tab name="data">Data</n-tab>
        </n-tabs>
      </template>
      <keep-alive>
        <component :is="currentTabComponent" />
      </keep-alive>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useHelpi18n } from "@/hooks/useHelpi18n.js"
import { Close } from "@vicons/ionicons5"
import GeneralSetting from "./general-setting.vue"
import DataSetting from "./data-setting.vue"

const show = defineModel<boolean>("show", { required: true })
const { ft } = useHelpi18n()
const activeTab = ref("general")

const currentTabComponent = computed(() => {
  if (activeTab.value === "general") {
    return GeneralSetting
  } else if (activeTab.value === "data") {
    return DataSetting
  }
  return null // Or a default component
})
</script>
