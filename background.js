const timers = {}
const checkInterval = 5000

// Função auxiliar para salvar o estado do timer
function saveTimerState(tabId, state) {
  chrome.storage.local.set({
    [`timer_state_${tabId}`]: {
      ...state,
      lastUpdated: Date.now(),
    },
  })
}

// Função auxiliar para carregar o estado do timer
function loadTimerState(tabId) {
  return new Promise(resolve => {
    chrome.storage.local.get(`timer_state_${tabId}`, result => {
      resolve(result[`timer_state_${tabId}`] || null)
    })
  })
}

// Função auxiliar para limpar o estado do timer
function clearTimerState(tabId) {
  chrome.storage.local.remove(`timer_state_${tabId}`)
}

setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
    const activeTab = tabs[0]
    if (!activeTab) return

    const currentUrl = activeTab.url
    const data = await new Promise(resolve => {
      chrome.storage.sync.get({ sites: [] }, resolve)
    })

    const siteConfig = data.sites.find(site =>
      currentUrl.includes(site.badSite)
    )

    if (siteConfig) {
      iniciarCronometro(
        activeTab.id,
        siteConfig.badSite,
        siteConfig.redirectTo,
        siteConfig.timeLimit
      )
    } else {
      pararCronometro(activeTab.id)
    }
  })
}, checkInterval)

async function iniciarCronometro(tabId, site, redirectTo, timeLimit) {
  // Se já existe um timer rodando, não cria outro
  if (timers[tabId]) return

  // Carrega o estado anterior do timer (se existir)
  let timerState = await loadTimerState(tabId)

  // Se não existe estado anterior ou é um novo site, cria um novo estado
  if (!timerState || timerState.site !== site) {
    timerState = {
      site,
      elapsedTime: 0,
      startTime: Date.now(),
    }
  } else {
    // Ajusta o startTime baseado no tempo decorrido
    timerState.startTime = Date.now() - timerState.elapsedTime * 1000
  }

  // Salva o estado inicial/atualizado
  saveTimerState(tabId, timerState)

  timers[tabId] = setInterval(async () => {
    const currentTime = Date.now()
    const elapsedSeconds = Math.floor(
      (currentTime - timerState.startTime) / 1000
    )

    timerState.elapsedTime = elapsedSeconds
    await saveTimerState(tabId, timerState)

    console.log(
      `Elapsed time for site ${site}: ${timerState.elapsedTime} seconds`
    )

    if (timerState.elapsedTime >= timeLimit) {
      console.log(
        `Time limit reached for site ${site}. Redirecting to ${redirectTo}.`
      )

      // Limpa o estado do timer apenas quando atinge o limite
      clearTimerState(tabId)

      // Para o timer e redireciona
      pararCronometro(tabId)
      chrome.tabs.update(tabId, { url: redirectTo })
    }
  }, 1000)
}

function pararCronometro(tabId) {
  if (timers[tabId]) {
    clearInterval(timers[tabId])
    delete timers[tabId]
    console.log(`Timer stopped for tab ${tabId}`)
  }
}

// Limpa o timer quando a aba é fechada
chrome.tabs.onRemoved.addListener(tabId => {
  pararCronometro(tabId)
})

// Escuta por atualizações na aba
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const timerState = await loadTimerState(tabId)
    if (timerState) {
      const data = await new Promise(resolve => {
        chrome.storage.sync.get({ sites: [] }, resolve)
      })

      const siteConfig = data.sites.find(site => tab.url.includes(site.badSite))

      if (siteConfig && tab.url.includes(timerState.site)) {
        iniciarCronometro(
          tabId,
          siteConfig.badSite,
          siteConfig.redirectTo,
          siteConfig.timeLimit
        )
      }
    }
  }
})

// Adiciona listener para mensagens do content script
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
