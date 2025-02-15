import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"

export const useThemeStore = defineStore("theme", () => {
  const theme = useLocalStorage<string>("theme", "green")

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
      textPrimary: "#333333",
      textSecondary: "#5c5c5c",
      borderColor: "#c8e0c5",
      hoverColor: "#b4c8b1",
      shadowColor: "rgba(33,84,61,0.2)",
      sepia: "0.6",
    },
    dark: {
      primary: "#2C3A4F",
      darkenPrimary: "#56647b",
      bodyBackground: "#1A1F2B",
      cardBackground: "#292e3b",
      textPrimary: "#cbd5e1",
      textSecondary: "#94a3b8",
      borderColor: "#353f51",
      hoverColor: "#56647b",
      shadowColor: "rgba(54,54,54,0.2)",
      sepia: "0.5",
    },
  }

  const setTheme = (value: string) => {
    theme.value = value
    setThemeProperty()
  }

  const setThemeProperty = () => {
    const root = document.documentElement
    const color = themeColor[theme.value]
    for (const key in color) {
      root.style.setProperty(`--${key}`, color[key])
    }
  }

  return {
    theme,
    themeColor,
    setTheme,
    setThemeProperty,
  }
})
