import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"

export const useThemeStore = defineStore("theme", () => {
  const theme = useLocalStorage<string>("theme", "pink")
  const themeColor: Record<string, Record<string, string>> = {
    pink: {
      primary: "#f65077",
      darkenPrimary: "#e0496c",
      bodyBackground: "#fafafa",
      cardBackground: "#ffffff",
      textPrimary: "#333333",
      textSecondary: "#666666",
      borderColor: "#e9e9e9",
      hoverColor: "#fae8ea",
      shadowColor: "rgba(143,57,80,0.2)",
      sepia: "0",
    },
    purple: {
      primary: "#8B5FBF",
      darkenPrimary: "#61398F",
      bodyBackground: "#F5F3F7",
      cardBackground: "#f1edf5",
      textPrimary: "#4A4A4A",
      textSecondary: "#878787",
      borderColor: "#E9E4ED",
      hoverColor: "#E9E4ED",
      shadowColor: "rgba(97,57,143,0.2)",
      sepia: "0.3",
    },
    green: {
      primary: "#4CAF50",
      darkenPrimary: "#2a9235",
      bodyBackground: "#eafbe5",
      cardBackground: "#e0f1db",
      textPrimary: "#18361a",
      textSecondary: "#304933",
      borderColor: "#c8e0c5",
      hoverColor: "#b4c8b1",
      shadowColor: "rgba(33,84,61,0.2)",
      sepia: "0.6",
    },
    dark: {
      primary: "#7d81da",
      darkenPrimary: "#6568b2",
      bodyBackground: "#1A1F2B",
      cardBackground: "#292e3b",
      textPrimary: "#cbd5e1",
      textSecondary: "#94a3b8",
      borderColor: "#353f51",
      hoverColor: "#6e78b2",
      shadowColor: "rgba(14,17,24,0.8)",
      sepia: "0.5",
    },
    orange: {
      primary: "#FF7F50",
      darkenPrimary: "#dd6236",
      bodyBackground: "#f6efdf",
      cardBackground: "#ece5d5",
      textPrimary: "#442e1a",
      textSecondary: "#6b635c",
      borderColor: "#dad4c0",
      hoverColor: "#ffd299",
      shadowColor: "rgba(122,90,48,0.2)",
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
      root.dataset.theme = theme.value
    }
  }

  return {
    theme,
    themeColor,
    setTheme,
    applyThemeAttribute,
  }
})
