import { defineStore } from "pinia"
import { useLocalStorage } from "@vueuse/core"

export const useLanguageStore = defineStore("Language", () => {
  const language = useLocalStorage("LANG", "en-US")

  const setLanguage = (value: string) => {
    language.value = value
  }

  return {
    language,
    setLanguage,
  }
})
