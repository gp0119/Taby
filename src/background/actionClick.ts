chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({
    url: "chrome://newtab/",
  })
  if (tabs.length > 0) {
    chrome.tabs.update(tabs[0].id!, { active: true })
  } else {
    chrome.tabs.create({ url: "chrome://newtab/" })
  }
})
