import tabbyDatabaseService from "../db/index"

chrome.runtime.onInstalled.addListener(() => {
  console.log("onInstalled....")
  tabbyDatabaseService.initDb()
})
