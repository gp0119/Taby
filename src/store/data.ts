import { defineStore } from "pinia";
import { iCard, iCollection } from "@/type.ts";
import { useLocalStorage } from "@vueuse/core";

export const useDataStore = defineStore("data", () => {
  const data = useLocalStorage<iCollection[]>("data", [
    {
      title: "常用",
      cards: [
        {
          title: "Google",
          url: "https://www.google.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "必应",
          url: "https://www.bing.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "百度一下，你就知道",
          url: "https://www.baidu.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "开发者搜索-Beta",
          url: "https://kaifa.baidu.com/home",
          customTitle: "",
          customDescription: "",
        },
        {
          title:
            "Stack Overflow - Where Developers Learn, Share, & Build Careers",
          url: "https://stackoverflow.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "I18n Translation Search Engine| Free Tools for software i18n",
          url: "https://i18ns.com/zh/index.html",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "GitHub",
          url: "https://github.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Chrome 网上应用店 - 扩展程序",
          url: "https://chrome.google.com/webstore/category/extensions?hl=zh-CN",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Neumorphism/Soft UI CSS shadow generator",
          url: "https://neumorphism.io/#e0e0e0",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Neumorphism UI",
          url: "https://demo.themesberg.com/neumorphism-ui/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "about:blank",
          url: "about:blank",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "QQ邮箱",
          url: "https://mail.qq.com/cgi-bin/frame_html?sid=gy6qXdrrlvbeCgFi&r=92f87e518d48f29cf59ddec95927ceba&lang=zh",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Alfred Gallery",
          url: "https://alfred.app/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Imgur: The magic of the Internet",
          url: "https://imgur.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Experiments",
          url: "chrome://flags/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Inspect with Chrome Developer Tools",
          url: "chrome://inspect/#devices",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "M-Team - TP :: 首頁 - Powered by mTorrent",
          url: "https://kp.m-team.cc/index",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "收件箱 - ganpeng0119@gmail.com - Gmail",
          url: "https://mail.google.com/mail/u/0/#inbox",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Greasy Fork - 安全、实用的用户脚本大全",
          url: "https://greasyfork.org/zh-CN",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Vercel",
          url: "https://vercel.com/gp0119s-projects",
          customTitle: "",
          customDescription: "",
        },
      ],
      labels: [],
    },
    {
      title: "chatGPT",
      cards: [
        {
          title: "New chat",
          url: "https://chat.openai.com/chat",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Claude",
          url: "https://claude.ai/chats",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "‎Gemini - 轻松对话，获取创意灵感",
          url: "https://gemini.google.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "ChatGPT - Poe",
          url: "https://poe.com/ChatGPT",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Copilot",
          url: "https://copilot.microsoft.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Key Rental",
          url: "https://key-rental.bowen.cool/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "One API",
          url: "https://www.gptapi.us/",
          customTitle: "",
          customDescription: "",
        },
      ],
      labels: [],
    },
    {
      title: "社区网站",
      cards: [
        {
          title: "掘金 - 代码不止，掘金不停",
          url: "https://juejin.cn/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "SegmentFault 思否",
          url: "https://segmentfault.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "V2EX",
          url: "https://www.v2ex.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "NGA玩家社区 P1",
          url: "https://bbs.nga.cn/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "发现 - 知乎",
          url: "https://www.zhihu.com/explore",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "前端 - InfoQ",
          url: "https://www.infoq.cn/topic/33",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "鱼塘热榜",
          url: "https://mo.fish/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "微信读书-正版书籍小说免费阅读",
          url: "https://weread.qq.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "博客园 - 开发者的网上家园",
          url: "https://www.cnblogs.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "KoolCenter - 源于玩家 服务玩家",
          url: "https://koolcenter.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "首页 - 威锋 - 千万果粉大本营",
          url: "https://www.feng.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "论坛 - 远景论坛 - 微软极客社区",
          url: "https://bbs.pcbeta.com/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "恩山无线论坛",
          url: "https://www.right.com.cn/forum/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "豆瓣",
          url: "https://www.douban.com/",
          customTitle: "",
          customDescription: "",
        },
      ],
      labels: [{ title: "社区网站", color: "pink" }],
    },
    {
      title: "Vue 3.0",
      cards: [
        {
          title: "Home | Vite 官方中文文档",
          url: "https://cn.vitejs.dev/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Vue.js - 渐进式 JavaScript 框架 | Vue.js",
          url: "https://staging-cn.vuejs.org/",
          customTitle: "Vue.js  3.0 - 渐进式 JavaScript 框架 | Vue.js",
          customDescription: "Vue.js - 渐进式 JavaScript 框架 | Vue.js",
        },
        {
          title: "Home | Pinia",
          url: "https://pinia.vuejs.org/zh/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Naive UI: 一个 Vue 3 组件库",
          url: "https://www.naiveui.com/zh-CN/os-theme",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "一个 Vue 3 UI 框架 | Element Plus",
          url: "https://element-plus.org/zh-CN/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Ant Design of Vue - Ant Design Vue",
          url: "https://www.antdv.com/docs/vue/introduce-cn",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Ant Design Vue",
          url: "https://2x.antdv.com/docs/vue/introduce-cn",
          customTitle: "Ant Design - Vue3.0",
          customDescription: "Ant Design Vue",
        },
        {
          title: "Vant - 轻量、可靠的移动端 Vue 组件库",
          url: "https://youzan.github.io/vant/#/zh-CN/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "vxe-table v4",
          url: "https://vxetable.cn/v4/#/table/start/install",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "VitePress | Vite & Vue Powered Static Site Generator",
          url: "https://vitepress.vuejs.org/",
          customTitle: "",
          customDescription: "",
        },
        {
          title:
            "antoniandre/wave-ui: An emerging UI framework for Vue.js & Vue 3 with only the bright side. ☀️",
          url: "https://github.com/antoniandre/wave-ui",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "Leaflet - 一个交互式地图 JavaScript 库",
          url: "https://leafletjs.cn/index.html",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "VueUse 中文文档",
          url: "https://vueuse.pages.dev/",
          customTitle: "",
          customDescription: "",
        },
        {
          title: "UnoCSS 中文文档",
          url: "https://unocss-cn.pages.dev/",
          customTitle: "",
          customDescription: "",
        },
      ],
      labels: [],
    },
  ]);

  function addCollection(collection: iCollection) {
    data.value.push(collection);
  }

  function removeCollection(index: number) {
    data.value.splice(index, 1);
  }

  function updateCollection(index: number, collection: iCollection) {
    data.value[index] = collection;
  }

  function addCard(index: number, card: iCard) {
    data.value[index].cards.push(card);
  }

  function removeCard(collectionIndex: number, cardIndex: number) {
    data.value[collectionIndex].cards.splice(cardIndex, 1);
  }

  function updateCard(collectionIndex: number, cardIndex: number, card: iCard) {
    data.value[collectionIndex].cards[cardIndex] = card;
  }

  function moveCard(
    fromCollectionIndex: number,
    fromCardIndex: number,
    toCollectionIndex: number,
    toCardIndex: number,
  ) {
    const card = data.value[fromCollectionIndex].cards[fromCardIndex];
    data.value[fromCollectionIndex].cards.splice(fromCardIndex, 1);
    data.value[toCollectionIndex].cards.splice(toCardIndex, 0, card);
  }

  function moveCardToCollection(
    fromCollectionIndex: number,
    fromCardIndex: number,
    toCollectionIndex: number,
  ) {
    const card = data.value[fromCollectionIndex].cards[fromCardIndex];
    data.value[fromCollectionIndex].cards.splice(fromCardIndex, 1);
    data.value[toCollectionIndex].cards.push(card);
  }

  function moveCollection(fromIndex: number, toIndex: number) {
    const collection = data.value[fromIndex];
    data.value.splice(fromIndex, 1);
    data.value.splice(toIndex, 0, collection);
  }

  return {
    data,
    addCollection,
    removeCollection,
    updateCollection,
    addCard,
    removeCard,
    updateCard,
    moveCard,
    moveCardToCollection,
    moveCollection,
  };
});
