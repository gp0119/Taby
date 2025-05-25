import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useModal, NInput, NScrollbar, NIcon } from "naive-ui"
import dataManager from "@/db"
import { debounce } from "lodash-es"
import { Card } from "@/type"
import Favicon from "@/components/favicon.vue"
import { SearchOutline } from "@vicons/ionicons5"
import { useEventListener } from "@vueuse/core"
import { useRefresh } from "@/hooks/useRresh"
import { useSpacesStore } from "@/store/spaces"

export const useSearchModal = () => {
  const searchValue = ref("")
  const modal = useModal()
  const { refreshCollections } = useRefresh()
  const spacesStore = useSpacesStore()
  const cards = ref<Card[]>([])
  const currentIndex = ref(0)
  const searchCardsFromDb = debounce(async () => {
    currentIndex.value = 0
    cards.value = (await dataManager.getCardsByTitleOrUrl(
      searchValue.value,
    )) as unknown as Card[]
  }, 300)
  const { ft } = useHelpi18n()

  const stopEnter = useEventListener(document, "keydown", (e) => {
    if (e.key === "Enter") {
      if (cards.value[currentIndex.value]) {
        onHandleClick(cards.value[currentIndex.value])
      }
    }
  })

  const stopArrow = useEventListener(document, "keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      if (currentIndex.value === 0 && e.key === "ArrowUp") {
        currentIndex.value = cards.value.length - 1
        return
      }
      if (
        currentIndex.value === cards.value.length - 1 &&
        e.key === "ArrowDown"
      ) {
        currentIndex.value = 0
        return
      }
      if (e.key === "ArrowUp") {
        currentIndex.value--
      } else if (e.key === "ArrowDown") {
        currentIndex.value++
      }
      const activeItem = document.querySelector(
        `[data-index="${currentIndex.value}"]`,
      )
      activeItem?.scrollIntoView({ block: "nearest" })
    }
  })

  onUnmounted(() => {
    stopEnter()
    stopArrow()
    modal.destroyAll()
  })

  const debounceUpdateCardFavicon = debounce(
    async (cardId: number, favicon: string, activeId: number) => {
      await dataManager.updateCardFavicon(cardId, favicon)
      await refreshCollections(activeId)
    },
    1000,
    {
      leading: true,
      trailing: false,
    },
  )

  async function onHandleClick(child: any) {
    modal.destroyAll()
    await new Promise((resolve) => setTimeout(resolve, 300))
    const tab = await chrome.tabs.create({ url: child.url })
    const activeId = spacesStore.activeId
    if (child.favicon) return
    const tabId = tab.id!
    chrome.tabs.onUpdated.addListener(
      async function listener(updatedTabId, changeInfo) {
        console.log("changeInfo: ", changeInfo)
        if (updatedTabId === tabId && changeInfo.favIconUrl) {
          const favicon = changeInfo.favIconUrl
          if (!favicon) return
          debounceUpdateCardFavicon(child.id, favicon, activeId)
          chrome.tabs.onUpdated.removeListener(listener)
        }
      },
    )
  }

  const openModal = () => {
    modal.create({
      class: "min-w-[800px] max-w-[1000px] w-[50vw] !bg-body-color",
      closable: false,
      autoFocus: true,
      preset: "card",
      title: () => <span class="text-text-primary">{ft("search")}</span>,
      style:
        "position: fixed; top: 200px; left: 50%; transform: translateX(-50%);",
      content: () => (
        <div>
          <div class="pr-4">
            <NInput
              round
              size="large"
              v-model:value={searchValue.value}
              on-input={searchCardsFromDb}
              placeholder={ft("search-placeholder")}
              v-slots={{
                prefix: () => <NIcon component={SearchOutline} />,
              }}
            ></NInput>
          </div>
          <NScrollbar class="mt-4 max-h-[500px] pr-4">
            {cards.value.length > 0 ? (
              cards.value.map((card, index) => (
                <div
                  key={card.id}
                  data-index={index}
                  class={`mb-2.5 cursor-pointer rounded-md border shadow-card-shadow ${
                    currentIndex.value === index ? "bg-hover-color" : ""
                  }`}
                  onClick={() => {
                    currentIndex.value = index
                    onHandleClick(card)
                  }}
                >
                  <div class="flex items-center px-2.5 py-1.5 text-text-primary">
                    <Favicon class="h-[28px] w-[28px]" child={card} />
                    <div class="flex flex-1 flex-col">
                      <span class="flex items-center text-ellipsis">
                        <span
                          v-html={card.title.replace(
                            new RegExp(searchValue.value, "gi"),
                            `<span class="font-semibold text-text-primary">${searchValue.value}</span>`,
                          )}
                        />
                        {card.description && (
                          <>
                            <span class="mx-2 inline-block h-[16px] w-[1px] bg-text-secondary"></span>
                            <span
                              v-html={card.description.replace(
                                new RegExp(searchValue.value, "gi"),
                                `<span class="font-semibold text-text-primary">${searchValue.value}</span>`,
                              )}
                            />
                          </>
                        )}
                      </span>
                      <div
                        class="text-ellipsis text-xs font-light text-text-secondary"
                        v-html={card.url.replace(
                          new RegExp(searchValue.value, "gi"),
                          `<span class="font-semibold text-text-primary">${searchValue.value}</span>`,
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div class="flex-center h-full pt-2.5 text-text-secondary">
                <NIcon component={SearchOutline} />
                <span class="ml-1.5">{ft("no-search-result")}</span>
              </div>
            )}
          </NScrollbar>
        </div>
      ),
      onAfterLeave: () => {
        searchValue.value = ""
        cards.value = []
        currentIndex.value = 0
        modal.destroyAll()
      },
    })
  }

  return {
    openModal,
  }
}
