import { useLocalStorage } from "@vueuse/core"

export function useExpand(key: string, defaultState = true) {
  const expandedItems = useLocalStorage<{
    [key: string]: boolean[]
  }>(key, {})

  function generateExpandedItems(activeSpaceIndex: number, length: number) {
    expandedItems.value[activeSpaceIndex] = Array.from(
      { length },
      () => defaultState,
    )
  }

  function toggleExpand(activeSpaceIndex: number, index: number) {
    expandedItems.value[activeSpaceIndex][index] =
      !expandedItems.value[activeSpaceIndex][index]
  }

  return {
    expandedItems,
    generateExpandedItems,
    toggleExpand,
  }
}
