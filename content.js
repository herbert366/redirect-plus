chrome.storage.sync.get({ sites: [] }, data => {
  const currentUrl = window.location.href
  const siteConfig = data.sites.find(site => currentUrl.includes(site.badSite))

  if (siteConfig) {
    console.log(
      `Starting timer for site: ${siteConfig.badSite}. Redirecting to: ${siteConfig.redirectTo} in ${siteConfig.timeLimit} seconds.`
    )
    chrome.runtime.sendMessage({
      action: 'startTimer',
      site: siteConfig.badSite,
      redirectTo: siteConfig.redirectTo,
      timeLimit: siteConfig.timeLimit,
    })
  } else {
    console.log('Stopping timer as the site is not in the list.')
    chrome.runtime.sendMessage({ action: 'stopTimer' })
  }
})
