import { useEventListener } from "@vueuse/core"
import { onUnmounted, watch, computed, isRef, type ComputedRef } from "vue"

export interface ShortcutConfig {
  shortcut: string
  handler: () => void
}

export interface UseShortcutOptions {
  target?: Window | Document | HTMLElement | EventTarget
  preventDefault?: boolean
  stopPropagation?: boolean
}

const doesEventMatchShortcut = (e: KeyboardEvent, shortcut?: string) => {
  if (!shortcut) return false
  const parts = shortcut.split("+")
  if (parts.length < 2) return false
  const requiredCtrl = parts.includes("Ctrl")
  const requiredShift = parts.includes("Shift")
  const requiredAlt = parts.includes("Alt")
  const finalKey = parts[parts.length - 1].toUpperCase()

  const pressedCtrl = e.ctrlKey || e.metaKey
  const pressedShift = e.shiftKey
  const pressedAlt = e.altKey

  if (pressedCtrl !== requiredCtrl) return false
  if (pressedShift !== requiredShift) return false
  if (pressedAlt !== requiredAlt) return false

  const eventKey = e.key.length === 1 ? e.key.toUpperCase() : e.key
  return eventKey === finalKey
}

export const useShortcutHotkeys = (
  items: ShortcutConfig[] | ComputedRef<ShortcutConfig[]>,
  options?: UseShortcutOptions,
) => {
  const target = options?.target || window
  const preventDefault = options?.preventDefault ?? true
  const stopPropagation = options?.stopPropagation ?? true

  let stopShortcutsListener: null | (() => void) = null

  const itemsRef: ComputedRef<ShortcutConfig[]> = isRef(items)
    ? (items as ComputedRef<ShortcutConfig[]>)
    : computed(() => items as ShortcutConfig[])

  const register = () => {
    if (stopShortcutsListener) stopShortcutsListener()
    const list = itemsRef.value.filter(
      (cfg) => !!cfg.shortcut && cfg.shortcut.trim().length > 0,
    )
    if (list.length === 0) {
      // 没有任何快捷键时不注册监听
      stopShortcutsListener = null
      return
    }
    stopShortcutsListener = useEventListener(target as any, "keydown", (e) => {
      for (const cfg of list) {
        if (doesEventMatchShortcut(e as KeyboardEvent, cfg.shortcut)) {
          if (preventDefault) (e as KeyboardEvent).preventDefault()
          if (stopPropagation) (e as KeyboardEvent).stopPropagation()
          cfg.handler()
          break
        }
      }
    })
  }

  watch(itemsRef, () => register(), { deep: true, immediate: true })

  onUnmounted(() => {
    if (stopShortcutsListener) stopShortcutsListener()
  })
}
