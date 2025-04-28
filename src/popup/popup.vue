<template>
  <div
    class="w-80 rounded-lg bg-[#fafafa] pb-4"
    v-if="activeTab && !isNewTabPage(activeTab.url || '')"
  >
    <div
      class="flex select-none items-center justify-between border-b border-gray-200 p-4 text-[#F65077]"
    >
      <h1 class="text-xl font-medium">Taby</h1>
      <span class="cursor-pointer" @click="openTaby">OPEN TABY</span>
    </div>
    <n-collapse
      accordion
      :expanded-names="expandedNames"
      @item-header-click="onHandleItemHeaderClick"
      arrow-placement="right"
      class="scrollbar-gutter-stable scrollbar-thin h-[500px] overflow-y-auto pt-4"
    >
      <n-collapse-item
        v-for="space in spaces"
        :key="space.id"
        :title="space.title"
        :name="space.id"
        class="group/collection px-4"
      >
        <template #header>
          <n-icon size="18">
            <component
              :is="space.icon ? ICON_LIST[space.icon] : StorefrontOutline"
            />
          </n-icon>
          <span class="select-none pl-2">{{ space.title }}</span>
        </template>
        <template #header-extra>
          <n-icon
            size="20"
            @click.stop="onClickHeaderExtra(space.id)"
            class="hidden text-[#F65077] group-hover/collection:block"
            title="Add Collection"
          >
            <component :is="AddOutline" />
          </n-icon>
        </template>
        <div
          class="flex items-center justify-between"
          v-if="isAddingCollection"
        >
          <n-input-group>
            <n-input
              v-model:value="newCollectionName"
              size="small"
              placeholder="Collection Name"
            />
            <n-button
              @click="isAddingCollection = false"
              size="small"
              class="rounded-l-none"
            >
              <template #icon>
                <n-icon size="18">
                  <component :is="CloseOutline" />
                </n-icon>
              </template>
            </n-button>
            <n-button
              size="small"
              class="rounded-l-none"
              @click="onAddCollection(space.id)"
            >
              <template #icon>
                <n-icon size="16">
                  <component :is="SaveOutline" />
                </n-icon>
              </template>
            </n-button>
          </n-input-group>
        </div>
        <div class="flex flex-col divide-y divide-gray-200">
          <template v-if="space.collections.length > 0">
            <div
              v-for="collection in space.collections"
              :key="collection.id"
              class="group flex items-center justify-between px-2.5 py-3"
            >
              <span class="select-none group-hover:text-[#F65077]">
                {{ collection.title }}
              </span>
              <n-icon
                size="16"
                class="hidden cursor-pointer text-[#F65077] group-hover:block"
                title="Save Tab to this collection"
                @click="onSave(collection)"
              >
                <component :is="SaveOutline" />
              </n-icon>
            </div>
          </template>
          <template v-if="space.collections.length <= 0 && !isAddingCollection">
            <span class="select-none py-2.5 text-gray-500">
              No collections here
            </span>
          </template>
        </div>
      </n-collapse-item>
    </n-collapse>
  </div>
  <div
    v-else
    class="max-h-[500px] w-80 rounded-lg bg-[#fafafa] p-4 text-lg font-medium text-gray-400"
  >
    Taby is already open, nothing to see here!
  </div>
</template>

<script setup lang="ts">
import dataManager from "@/db"
import { SpaceWithCollections, Collection } from "@/type.ts"
import { ICON_LIST } from "@/utils/constants.ts"
import {
  StorefrontOutline,
  SaveOutline,
  AddOutline,
  CloseOutline,
} from "@vicons/ionicons5"
import { useDialog, useMessage } from "naive-ui"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useI18n } from "vue-i18n"
import { useLocalStorage } from "@vueuse/core"
import { isNewTabPage } from "@/utils"

const currentLanguage = useLocalStorage("LANG", "en-US")
const { locale } = useI18n()
const dialog = useDialog()
const message = useMessage()
const { ft, ft2 } = useHelpi18n()
const spaces = ref<SpaceWithCollections[]>([])
const newCollectionName = ref("")
const isAddingCollection = ref(false)
const expandedNames = ref<number | null>(null)
const activeTab = ref<chrome.tabs.Tab | null>(null)

watchEffect(() => {
  locale.value = currentLanguage.value
})

const openTaby = async () => {
  const tabs = await chrome.tabs.query({
    url: "chrome://newtab/",
  })
  if (tabs.length > 0) {
    chrome.tabs.update(tabs[0].id!, { active: true })
  } else {
    chrome.tabs.create({ url: "chrome://newtab/" })
  }
}

const getSpaces = async () => {
  spaces.value = await dataManager.getAllSpaceWithCollections()
}

onMounted(async () => {
  activeTab.value = (
    await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })
  )?.[0]
  console.log("activeTab.value: ", activeTab.value)
  await getSpaces()
})

const onHandleItemHeaderClick = ({
  name,
  expanded,
}: {
  name: number
  expanded: boolean
}) => {
  isAddingCollection.value = false
  if (expanded) {
    expandedNames.value = name
  } else {
    expandedNames.value = null
  }
}

const onClickHeaderExtra = (spaceId: number) => {
  isAddingCollection.value = true
  expandedNames.value = spaceId
}

const onSave = async (collection: Collection) => {
  const title = activeTab.value?.title
  const url = activeTab.value?.url
  dialog.error({
    title: ft("save-tabs"),
    titleClass: "[&_.n-base-icon]:hidden",
    content: ft2("save-confirm", {
      type: title || "",
      collection: collection.title,
    }),
    negativeText: ft("cancel"),
    positiveText: ft("confirm"),
    onPositiveClick: async () => {
      const favicon = activeTab.value?.favIconUrl
      let faviconId = null
      if (favicon) {
        faviconId = await dataManager.addFavicon(favicon)
      }
      await dataManager.addCard({
        title: title || "",
        url: url || "",
        collectionId: Number(collection.id),
        ...(faviconId && { faviconId }),
      })
      message.success(ft("success", "save"))
      await getSpaces()
      await sendMessageToTaby()
    },
  })
}

const onAddCollection = async (spaceId: number) => {
  await dataManager.addCollection({
    title: newCollectionName.value,
    spaceId: Number(spaceId),
    labelIds: [],
  })
  newCollectionName.value = ""
  isAddingCollection.value = false
  await getSpaces()
  await sendMessageToTaby()
}

const sendMessageToTaby = async () => {
  localStorage.setItem("refreshCollections", "true")
}
</script>
