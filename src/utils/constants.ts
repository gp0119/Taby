import {
  StorefrontOutline,
  WalletOutline,
  ApertureOutline,
  AppsOutline,
  BagHandleOutline,
  BalloonOutline,
  BasketballOutline,
  BaseballOutline,
  BeerOutline,
  BicycleOutline,
  BoatOutline,
  BookOutline,
  BookmarksOutline,
  BriefcaseOutline,
  BusOutline,
  CalendarOutline,
  CarSportOutline,
  CartOutline,
  ChatbubbleEllipsesOutline,
  ChatbubblesOutline,
  CloudOutline,
  CodeSlashOutline,
  ColorFilterOutline,
  CogOutline,
  ColorPaletteOutline,
  CompassOutline,
  DiamondOutline,
  EarthOutline,
  EaselOutline,
  ExtensionPuzzleOutline,
  FitnessOutline,
  FishOutline,
  FlameOutline,
  FlashOutline,
  FlowerOutline,
  FootballOutline,
  FootstepsOutline,
  GameControllerOutline,
  GiftOutline,
  GlobeOutline,
  GlassesOutline,
  GolfOutline,
  HammerOutline,
  HandLeftOutline,
  HandRightOutline,
  HeadsetOutline,
  HeartCircleOutline,
  HelpBuoyOutline,
  HomeOutline,
  IceCreamOutline,
  ImagesOutline,
  KeyOutline,
  LeafOutline,
  LibraryOutline,
  MegaphoneOutline,
  RestaurantOutline,
  SkullOutline,
  SnowOutline,
  SubwayOutline,
  TrophyOutline,
  WatchOutline,
  TrailSignOutline,
  SyncCircleOutline,
  SunnyOutline,
  StarOutline,
  ShirtOutline,
  SchoolOutline,
  SadOutline,
  RocketOutline,
  RibbonOutline,
  RainyOutline,
  PrismOutline,
  PrintOutline,
  PizzaOutline,
  PieChartOutline,
  PeopleOutline,
  PawOutline,
  PartlySunnyOutline,
  PaperPlaneOutline,
  NotificationsOutline,
  MusicalNotesOutline,
  MicOutline,
  MedalOutline,
  MailOpenOutline,
} from "@vicons/ionicons5"
import { MacCommand, MacShift, MacOption } from "@vicons/carbon"

export const COLOR_LIST = [
  // 红色系 (3)
  "#991B1B", // 深红褐色
  "#EF4444", // 鲜红色
  "#E11D48", // 玫瑰红

  // 粉色系 (2)
  "#EC4899", // Pink - 粉红色
  "#C06C84", // 暗粉色

  // 橙色系 (3)
  "#F97316", // Orange - 橙色
  "#e76f51", // 珊瑚色
  "#F59E0B", // Amber - 琥珀色

  // 绿色系 (4)
  "#059669", // Emerald - 深绿色
  "#22C55E", // Green - 自然绿
  "#84CC16", // Lime - 青柠色
  "#606c38", // 橄榄绿

  // 青色系 (2)
  "#14B8A6", // Teal - 青色
  "#06B6D4", // Cyan - 青蓝色

  // 蓝色系 (3)
  "#0EA5E9", // Sky blue - 清新天蓝色
  "#3B82F6", // Blue - 蓝色
  "#264653", // 深蓝灰色

  // 靛蓝色系 (2)
  "#4361ee", // 靛蓝色
  "#4F46E5", // Indigo Dark - 深靛蓝

  // 紫色系 (3)
  "#7C3AED", // Purple - 深紫色
  "#9333EA", // Violet - 紫罗兰
  "#A855F7", // Fuchsia - 紫红色

  // 灰色/棕色系 (2)
  "#401D19", // 深棕色
  "#6B7280", // Gray - 优雅灰
] as const

export const ICON_LIST: Record<string, Component> = {
  StorefrontOutline,
  WalletOutline,
  ApertureOutline,
  AppsOutline,
  BagHandleOutline,
  BalloonOutline,
  BasketballOutline,
  BaseballOutline,
  BeerOutline,
  BicycleOutline,
  BoatOutline,
  BookOutline,
  BookmarksOutline,
  BriefcaseOutline,
  BusOutline,
  CalendarOutline,
  CarSportOutline,
  CartOutline,
  ChatbubbleEllipsesOutline,
  ChatbubblesOutline,
  CloudOutline,
  CodeSlashOutline,
  ColorFilterOutline,
  CogOutline,
  ColorPaletteOutline,
  CompassOutline,
  DiamondOutline,
  EarthOutline,
  EaselOutline,
  ExtensionPuzzleOutline,
  FitnessOutline,
  FishOutline,
  FlameOutline,
  FlashOutline,
  FlowerOutline,
  FootballOutline,
  FootstepsOutline,
  GameControllerOutline,
  GiftOutline,
  GlobeOutline,
  GlassesOutline,
  GolfOutline,
  HammerOutline,
  HandLeftOutline,
  HandRightOutline,
  HeadsetOutline,
  HeartCircleOutline,
  HelpBuoyOutline,
  HomeOutline,
  IceCreamOutline,
  ImagesOutline,
  KeyOutline,
  LeafOutline,
  LibraryOutline,
  MegaphoneOutline,
  RestaurantOutline,
  SkullOutline,
  SnowOutline,
  SubwayOutline,
  TrophyOutline,
  WatchOutline,
  TrailSignOutline,
  SyncCircleOutline,
  SunnyOutline,
  StarOutline,
  ShirtOutline,
  SchoolOutline,
  SadOutline,
  RocketOutline,
  RibbonOutline,
  RainyOutline,
  PrismOutline,
  PrintOutline,
  PizzaOutline,
  PieChartOutline,
  PeopleOutline,
  PawOutline,
  PartlySunnyOutline,
  PaperPlaneOutline,
  NotificationsOutline,
  MusicalNotesOutline,
  MicOutline,
  MedalOutline,
  MailOpenOutline,
} as const

export const GITHUB_API = "https://api.github.com"
export const GITEE_API = "https://gitee.com/api/v5"
export const SYNC_GIST_ID = "gistId"
export const SYNC_GIST_TOKEN = "accessToken"
export const SYNC_TYPE = "syncType"
export const REMOTE_LAST_UPDATE_TIME = "remoteLastUpdateTime" // Stored in chrome.storage.sync
export const LOCAL_LAST_DOWNLOAD_TIME = "localLastDownloadTime" // Stored in localStorage

export const THEME_COLOR = {
  light: {
    primary: "#5dabfe",
    primaryHover: "#3391ff",
    bodyBg: "#e6eaef",
    contentBg: "#f4f5f7",
    cardBg: "#ffffff",
    dialogBg: "#ffffff",
    textPrimary: "#1a202c",
    textSecondary: "#b0b7c1",
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
    textSecondary: "#a1a2a4",
    borderColor: "#353f51",
    hoverColor: "#32363a",
    shadowColor: "rgba(14,17,24,0.8)",
  },
}

// Shortcut key icon mapping
export const SHORTCUT_ICON_MAP: Record<string, any> = {
  Ctrl: MacCommand,
  Cmd: MacCommand,
  Shift: MacShift,
  Alt: MacOption,
}

// Default shortcut settings
export const DEFAULT_SHORTCUT_SETTINGS = {
  saveAllTabs: "Ctrl+S",
  saveAllTabsAndClose: "Ctrl+Shift+S",
  closeDuplicateTabs: "Ctrl+D",
  closeAllTabs: "Ctrl+Shift+D",
  globalSearch: "Ctrl+F",
  openTagFilter: "Ctrl+G",
} as const
