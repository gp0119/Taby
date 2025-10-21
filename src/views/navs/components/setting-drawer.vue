<template>
  <n-drawer
    v-model:show="show"
    :width="450"
    placement="right"
    :auto-focus="false"
  >
    <n-drawer-content header-class="bg-setting-color !pb-0">
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
        <n-tabs
          v-model:value="activeTab"
          type="bar"
          size="small"
          class="mt-2.5"
          justify-content="space-evenly"
        >
          <n-tab name="general">{{ ft("general") }}</n-tab>
          <n-tab name="data">{{ ft("data") }}</n-tab>
        </n-tabs>
      </template>
      <KeepAlive>
        <component
          :is="activeTab === 'general' ? GeneralSetting : DataSetting"
        />
      </KeepAlive>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { Close } from "@vicons/ionicons5"
import GeneralSetting from "./general-setting.vue"
import DataSetting from "./data-setting.vue"

const show = defineModel<boolean>("show", { required: true })
const { ft } = useHelpi18n()

const activeTab = ref("general")
</script>
