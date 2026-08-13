<template>
  <div
    class="group/item flex h-full w-full flex-col rounded-xl border-2 border-transparent bg-card-color"
    :class="{
      '!border-primary': batchCollectionStore.selectedCollectionIds.includes(
        collection.id,
      ),
    }"
  >
    <div
      class="group/collection-title flex w-full items-center justify-between overflow-hidden pr-6"
    >
      <div
        class="flex flex-1 select-none items-center justify-start overflow-hidden pl-6"
      >
        <div class="flex-center relative py-3">
          <n-checkbox
            class="mobile-hover-only absolute -left-5 mr-2 hidden w-[20px] group-hover/collection-title:block"
            :class="{
              '!block': batchCollectionStore.selectedCollectionIds.includes(
                collection.id,
              ),
              '!hidden':
                batchCardStore.selectedCardIds.length > 0 ||
                batchTabsStore.selectedTabIds.length > 0 ||
                duplicateCardStore.isFindDuplicate,
            }"
            size="large"
            :checked="
              batchCollectionStore.selectedCollectionIds.includes(collection.id)
            "
            @update:checked="onHandleCheckbox($event, collection.id)"
          />
          <!-- 标题 -->
          <div
            class="flex-center cursor-pointer flex-nowrap text-text-primary"
            :class="{
              '!text-primary':
                batchCollectionStore.selectedCollectionIds.includes(
                  collection.id,
                ),
            }"
            @click="isOpen = !isOpen"
          >
            <n-icon
              size="20"
              class="w-[20px] transition-transform duration-300"
              :class="{ 'rotate-90': isOpen }"
            >
              <ChevronForward />
            </n-icon>
            <span class="ml-2 whitespace-nowrap text-lg font-medium">
              {{ collection.title }}
            </span>
          </div>

          <span
            class="mx-4 h-[16px] w-[0.5px] flex-shrink-0 bg-text-secondary"
          />

          <!-- 卡片数量 -->
          <PopoverWrapper
            :message="ft('open-all-tabs')"
            :disabled="isMobileWeb"
            placement="top-start"
          >
            <div
              class="flex items-center rounded bg-hover-color py-0.5 pl-1.5 text-xs text-text-secondary"
              :class="{
                'cursor-pointer pr-0.5': !isMobileWeb,
                'pr-1.5': isMobileWeb,
              }"
              @click="onOpenCollection($event, collection)"
            >
              <span class="whitespace-nowrap">
                {{ collection.cards.length }} cards
              </span>
              <n-icon v-if="!isMobileWeb" size="12" :component="ArrowUpRight" />
            </div>
          </PopoverWrapper>
        </div>
        <span
          v-if="collection.labels.length > 0"
          class="mx-4 h-[16px] w-[0.5px] flex-shrink-0 bg-text-secondary"
        />

        <!-- 标签 -->
        <Tags :labels="collection.labels" :collection-id="collection.id" />
      </div>
      <!-- 操作 -->
      <div
        class="collection-actions-wrapper flex min-w-[120px] flex-shrink-0 items-center justify-end"
      >
        <CollectionAction :item="collection" />
      </div>
    </div>

    <div
      class="grid flex-1 transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="overflow-hidden">
        <slot name="cards" :collection="collection" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronForward } from "@vicons/ionicons5"
import { ArrowUpRight } from "@vicons/carbon"
import { CollectionWithCards } from "@/type"
import CollectionAction from "./collection-action.vue"
import Tags from "./tags.vue"
import { useExpandStore } from "@/store/expand"
import { useBatchCollectionStore } from "@/store/batch-collection"
import { useBatchCardStore } from "@/store/batch-card"
import { useBatchTabsStore } from "@/store/batch-tabs"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useChromeTabs } from "@/hooks/useChromeTabs"
import { useSettingStore } from "@/store/setting"
import { hasExtensionTabs, isWeb } from "@/utils/platform"
import { useMediaQuery } from "@vueuse/core"
import { openWebUrls } from "@/utils/web"
import { useMessage } from "naive-ui"

const { ft } = useHelpi18n()
const message = useMessage()
const settingStore = useSettingStore()
const duplicateCardStore = useDuplicateCardStore()
const { openTabs, groupTabs, openInNewWindow } = useChromeTabs()
const mobileLayoutQuery = useMediaQuery("(max-width: 999px)")
const isMobileWeb = computed(() => isWeb && mobileLayoutQuery.value)
const props = defineProps<{
  collection: CollectionWithCards
}>()

const expandStore = useExpandStore()
const batchCollectionStore = useBatchCollectionStore()
const batchCardStore = useBatchCardStore()
const batchTabsStore = useBatchTabsStore()
const isOpen = computed({
  get: () => expandStore.isCollectionExpanded(props.collection.id),
  set: (value) => {
    if (value) {
      expandStore.toggleCollection(props.collection.id)
    } else {
      expandStore.toggleCollection(props.collection.id)
    }
  },
})

const onHandleCheckbox = (checked: boolean, collectionId: number) => {
  if (checked) {
    batchCollectionStore.addSelectedCollectionId(collectionId)
  } else {
    batchCollectionStore.removeSelectedCollectionId(collectionId)
  }
}

async function onOpenCollection(
  e: MouseEvent,
  collection: CollectionWithCards,
) {
  if (isMobileWeb.value) return
  if (!collection.cards.length) return
  const urls = collection.cards.map((c) => c.url)
  if (!hasExtensionTabs()) {
    const { opened, total } = openWebUrls(urls)
    if (opened < total) message.warning(ft("allow-popups-to-open-all"))
    return
  }
  if (e.shiftKey) {
    const tabs = await openInNewWindow(urls)
    if (settingStore.getSetting("openCardsInGroup") && tabs.length) {
      const ids = tabs.map((t) => t.id!).filter(Boolean) as number[]
      await groupTabs(ids, collection.title, tabs[0].windowId)
    }
  } else {
    const tabs = await openTabs(urls, {
      windowId: undefined,
      background: e.ctrlKey || e.metaKey,
    })

    if (settingStore.getSetting("openCardsInGroup") && tabs.length) {
      const ids = tabs.map((t) => t.id!).filter(Boolean) as number[]
      await groupTabs(ids, collection.title)
    }
  }
}
</script>
