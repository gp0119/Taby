import { readonly, ref, watch, type WatchSource } from "vue"

export const useAnimatedPresence = (source: WatchSource<number>) => {
  const animated = ref(false)
  const show = ref(false)

  const onAnimationEnd = () => {
    animated.value = false
  }

  watch(
    source,
    (newLength, oldLength) => {
      show.value = newLength > 0
      if ((oldLength ?? 0) > 0 && newLength > 0 && newLength !== oldLength) {
        animated.value = true
      }
    },
    { immediate: true },
  )

  return {
    show: readonly(show),
    animated: readonly(animated),
    onAnimationEnd,
  }
}
