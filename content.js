chrome.storage.sync.get({ sites: [] }, data => {
  const currentUrl = window.location.href
  const siteConfig = data.sites.find(site => currentUrl.includes(site.badSite))

  if (siteConfig) {
    chrome.runtime.sendMessage({
      action: 'startTimer',
      site: siteConfig.badSite,
      redirectTo: siteConfig.redirectTo,
      timeLimit: siteConfig.timeLimit,
    })
  } else {
    chrome.runtime.sendMessage({ action: 'stopTimer' })
  }
})
