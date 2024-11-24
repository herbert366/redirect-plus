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
  chrome.windows.getCurrent({ populate: true }, currentWindow => {
    if (currentWindow.focused) {
      chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
        const activeTab = tabs[0]
        if (!activeTab) return

        const currentUrl = activeTab.url
        console.log(
          `1° Check: Verificando se a URL ${currentUrl} está na lista de bad sites.`
        )

        const data = await new Promise(resolve => {
          chrome.storage.sync.get({ sites: [] }, resolve)
        })

        const siteConfig = data.sites.find(site =>
          currentUrl.includes(site.badSite)
        )

        if (siteConfig) {
          // Verifica se a regra está ativa
          if (siteConfig.active) {
            console.log(
              `2° Check: A URL está na lista de bad sites e a regra está ativa. Iniciando cronômetro.`
            )
            iniciarCronometro(
              activeTab.id,
              siteConfig.badSite,
              siteConfig.redirectTo,
              siteConfig.timeLimit
            )
          } else {
            console.log(
              `A URL está na lista de bad sites, mas a regra está desativada. Nenhuma ação necessária.`
            )
            pararCronometro(activeTab.id)
          }
        } else {
          console.log(
            `URL não está na lista de bad sites. Nenhuma ação necessária.`
          )
          pararCronometro(activeTab.id)
        }
      })
    } else {
      // Se a janela não está focada, parar todos os cronômetros ativos
      Object.keys(timers).forEach(tabId => pararCronometro(parseInt(tabId)))
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
    console.log(`Novo estado criado para o site: ${site}`)
  } else {
    // Ajusta o startTime baseado no tempo decorrido
    timerState.startTime = Date.now() - timerState.elapsedTime * 1000
    console.log(`Recuperado estado existente para o site: ${site}`)
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

    // 3° Check: se o tempo total gasto é igual ao tempo limite
    if (timerState.elapsedTime >= timeLimit) {
      console.log(`3° Check: Tempo limite atingido para o site ${site}.`)

      // 4° Check: Reseta o tempo total gasto
      timerState.elapsedTime = 0
      saveTimerState(tabId, timerState)
      console.log(`4° Check: Tempo total gasto resetado para ${site}.`)

      // Limpa o estado do timer apenas quando atinge o limite
      clearTimerState(tabId)

      // Para o timer e redireciona
      pararCronometro(tabId)
      console.log(`Redirecionando para ${redirectTo}.`)
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

      if (
        siteConfig &&
        siteConfig.active &&
        tab.url.includes(timerState.site)
      ) {
        console.log(
          `5° Check: A URL redirecionada ainda está no bad site e a regra está ativa. Reiniciando cronômetro.`
        )
        iniciarCronometro(
          tabId,
          siteConfig.badSite,
          siteConfig.redirectTo,
          siteConfig.timeLimit
        )
      } else {
        console.log(
          `A regra para o site ${siteConfig?.badSite} está desativada ou o site não corresponde. Nenhuma ação necessária.`
        )
        pararCronometro(tabId)
      }
    }
  }
})
