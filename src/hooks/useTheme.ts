import { useSettingStore } from "@/store/setting"
import { THEME_COLOR } from "@/utils/constants"
import type { GlobalThemeOverrides } from "naive-ui"

export const useTheme = () => {
  const settingStore = useSettingStore()
  const theme = computed(() => settingStore.getSetting("theme"))
  const currentThemeColor = computed(() => THEME_COLOR[theme.value])

  const themeOverrides: ComputedRef<GlobalThemeOverrides> = computed(() => ({
    common: {
      primaryColor: currentThemeColor.value.primary,
      primaryColorHover: currentThemeColor.value.primaryHover,
      inputColor: currentThemeColor.value.cardBg,
      popoverColor: currentThemeColor.value.cardBg,
      hoverColor: currentThemeColor.value.hoverColor,
    },
    Button: {
      colorPressedPrimary: currentThemeColor.value.primaryHover,
      waveOpacity: 0,
      borderRadiusSmall: "6px",
      borderRadiusMedium: "6px",
    },
    Dialog: {
      borderRadius: "18px",
    },
    Input: {
      color: currentThemeColor.value.cardBg,
      textColor: currentThemeColor.value.textPrimary,
      boxShadowActive: "none",
      boxShadowFocus: "none",
      borderRadius: "6px",
    },
    Select: {
      boxShadowFocus: "none",
      boxShadowActive: "none",
    },
    SelectOption: {
      color: currentThemeColor.value.cardBg,
      textColor: currentThemeColor.value.textPrimary,
    },
    Form: {
      labelTextColor: currentThemeColor.value.textPrimary,
    },
    Radio: {
      buttonColor: currentThemeColor.value.cardBg,
      buttonTextColor: currentThemeColor.value.textPrimary,
      buttonColorActive: currentThemeColor.value.primary,
      buttonBorderColorActive: currentThemeColor.value.primary,
      buttonTextColorActive: "#fff",
      buttonBorderRadius: "6px",
    },
    Tag: {
      colorBordered: currentThemeColor.value.cardBg,
      closeIconColor: currentThemeColor.value.textPrimary,
    },
    LoadingBar: {
      colorLoading: "#18A058",
    },
    Popover: {
      borderRadius: "12px",
    },
    Dropdown: {
      borderRadius: "12px",
    },
    Card: {
      borderRadius: "12px",
    },
  }))

  const setTheme = (value: "light" | "dark") => {
    settingStore.setSetting("theme", value)
  }

  const applyThemeAttribute = (_theme: "light" | "dark") => {
    const root = document.documentElement
    if (root) {
      root.dataset.theme = _theme
    }
  }

  watchEffect(() => {
    applyThemeAttribute(theme.value)
  })

  return {
    theme,
    themeOverrides,
    setTheme,
  }
}
