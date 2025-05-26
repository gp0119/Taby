import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"

export const useThemeStore = defineStore("theme", () => {
  const theme = useLocalStorage<string>("theme", "light")
  const themeColor: Record<string, Record<string, string>> = {
    light: {
      primary: "#5dabfe",
      primaryHover: "#3391ff",
      bodyBg: "#e6eaef",
      contentBg: "#f4f5f7",
      cardBg: "#ffffff",
      dialogBg: "#ffffff",
      textPrimary: "#333333",
      textSecondary: "#666666",
      borderColor: "#e9e9e9",
      hoverColor: "#f4f5f7",
    },
    dark: {
      primary: "#8acbec",
      primaryHover: "#70c0e8",
      bodyBg: "#0e1013",
      contentBg: "#18191b",
      cardBg: "#1f2123",
      dialogBg: "#272a2d",
      textPrimary: "#cbd5e1",
      textSecondary: "#94a3b8",
      borderColor: "#353f51",
      hoverColor: "#32363a",
      shadowColor: "rgba(14,17,24,0.8)",
    },
  }

  const setTheme = (value: string) => {
    theme.value = value
    applyThemeAttribute()
  }

  const applyThemeAttribute = () => {
    const root = document.documentElement
    if (root) {
      if (["light", "dark"].includes(theme.value)) {
        root.dataset.theme = theme.value
      } else {
        root.dataset.theme = "light"
        theme.value = "light"
      }
    }
  }

  return {
    theme,
    themeColor,
    setTheme,
    applyThemeAttribute,
  }
})
