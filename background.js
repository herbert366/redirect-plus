const timers = {}

// Ouve mensagens de `content.js` para iniciar ou parar cronômetros
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'startTimer') {
    iniciarCronometro(
      sender.tab.id,
      message.site,
      message.redirectTo,
      message.timeLimit
    )
  } else if (message.action === 'stopTimer') {
    pararCronometro(sender.tab.id)
  }
})

function iniciarCronometro(tabId, site, redirectTo, timeLimit) {
  // Reseta o cronômetro para o site específico na aba
  pararCronometro(tabId)

  timers[tabId] = setTimeout(() => {
    chrome.tabs.update(tabId, { url: redirectTo })
    delete timers[tabId]
  }, timeLimit * 1000)
}

function pararCronometro(tabId) {
  if (timers[tabId]) {
    clearTimeout(timers[tabId])
    delete timers[tabId]
  }
}
