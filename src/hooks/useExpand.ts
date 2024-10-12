export function useExpand(defaultState = true) {
  const expandedItems = ref<boolean[]>([]);

  function generateExpandedItems(length: number) {
    expandedItems.value = Array.from({ length }, () => defaultState);
  }

  function toggleExpand(index: number) {
    expandedItems.value[index] = !expandedItems.value[index];
  }

  return {
    expandedItems,
    generateExpandedItems,
    toggleExpand,
  };
}
