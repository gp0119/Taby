import { defineManifest } from "@crxjs/vite-plugin"
import pkg from "./package.json"

export default defineManifest({
  name: "Taby - Simple & Powerful New Tab",
  manifest_version: 3,
  version: pkg.version,
  description:
    "A simple yet powerful new tab extension to help you efficiently manage tabs and personalize your browsing experience.",
  chrome_url_overrides: {
    newtab: "newtab.html",
  },
  author: {
    email: "ganpeng0119@gmail.com",
  },
  permissions: [
    "favicon",
    "storage",
    "tabs",
    "activeTab",
    "contextMenus",
    "tabGroups",
  ],
  host_permissions: ["<all_urls>"],
  web_accessible_resources: [
    {
      resources: ["icons/*"],
      matches: ["<all_urls>"],
    },
  ],
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  icons: {
    32: "src/assets/icon32.png",
    48: "src/assets/icon48.png",
    128: "src/assets/icon128.png",
  },
  action: {
    default_title: "Taby",
    default_icon: {
      32: "src/assets/icon32.png",
      48: "src/assets/icon48.png",
      128: "src/assets/icon128.png",
    },
  },
})
