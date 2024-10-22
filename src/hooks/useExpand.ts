import { useLocalStorage } from "@vueuse/core"

export function useExpand(key: string, defaultState = true) {
  const expandedItems = useLocalStorage<{
    [key: string]: boolean[]
  }>(key, {})

  function generateExpandedItems(activeSpaceId: number, length: number) {
    expandedItems.value[activeSpaceId] = Array.from(
      { length },
      () => defaultState,
    )
  }

  function toggleExpand(activeSpaceId: number, index: number) {
    expandedItems.value[activeSpaceId][index] =
      !expandedItems.value[activeSpaceId][index]
  }

  return {
    expandedItems,
    generateExpandedItems,
    toggleExpand,
  }
}
