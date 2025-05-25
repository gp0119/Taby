import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"

export const useThemeStore = defineStore("theme", () => {
  const theme = useLocalStorage<string>("theme", "light")
  const themeColor: Record<string, Record<string, string>> = {
    light: {
      primary: "#4d9e5d",
      bodyBackground: "#fafafa",
      cardBackground: "#ffffff",
      textPrimary: "#333333",
      textSecondary: "#666666",
      borderColor: "#e9e9e9",
      hoverColor: "#fae8ea",
      shadowColor: "rgba(143,57,80,0.2)",
      sepia: "0",
    },
    dark: {
      primary: "#63e2b7",
      bodyBackground: "#1A1F2B",
      cardBackground: "#292e3b",
      textPrimary: "#cbd5e1",
      textSecondary: "#94a3b8",
      borderColor: "#353f51",
      hoverColor: "#6e78b2",
      shadowColor: "rgba(14,17,24,0.8)",
      sepia: "0.5",
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
