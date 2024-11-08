document.addEventListener('DOMContentLoaded', () => {
  carregarValoresTemporarios()
  atualizarListaSites()
})

const badSiteInput = document.getElementById('badSite')
const redirectToInput = document.getElementById('redirectTo')
const timeLimitInput = document.getElementById('timeLimit')

// Salva os valores nos campos ao digitar
badSiteInput.addEventListener('input', salvarValoresTemporarios)
redirectToInput.addEventListener('input', salvarValoresTemporarios)
timeLimitInput.addEventListener('input', salvarValoresTemporarios)

// Botão "Salvar" que adiciona o novo site
document.getElementById('addRule').addEventListener('click', () => {
  const badSite = badSiteInput.value
  const redirectTo = redirectToInput.value
  const timeLimit = parseInt(timeLimitInput.value)

  if (badSite && redirectTo && timeLimit) {
    chrome.storage.sync.get({ sites: [] }, data => {
      const sites = data.sites
      sites.push({ badSite, redirectTo, timeLimit })
      chrome.storage.sync.set({ sites }, () => {
        atualizarListaSites()
        limparValoresTemporarios() // Limpa os campos e o armazenamento temporário
      })
    })
  }
})

// Função para salvar os valores temporários enquanto o usuário digita
function salvarValoresTemporarios() {
  chrome.storage.local.set({
    tempBadSite: badSiteInput.value,
    tempRedirectTo: redirectToInput.value,
    tempTimeLimit: timeLimitInput.value,
  })
}

// Função para carregar os valores temporários ao abrir o popup
function carregarValoresTemporarios() {
  chrome.storage.local.get(
    ['tempBadSite', 'tempRedirectTo', 'tempTimeLimit'],
    data => {
      if (data.tempBadSite) badSiteInput.value = data.tempBadSite
      if (data.tempRedirectTo) redirectToInput.value = data.tempRedirectTo
      if (data.tempTimeLimit) timeLimitInput.value = data.tempTimeLimit
    }
  )
}

// Função para limpar os valores temporários após salvar
function limparValoresTemporarios() {
  chrome.storage.local.remove([
    'tempBadSite',
    'tempRedirectTo',
    'tempTimeLimit',
  ])
  badSiteInput.value = ''
  redirectToInput.value = ''
  timeLimitInput.value = ''
}

// Função para atualizar a lista de sites configurados
function atualizarListaSites() {
  chrome.storage.sync.get({ sites: [] }, data => {
    const list = document.getElementById('sitesList')
    list.innerHTML = ''
    data.sites.forEach(site => {
      const li = document.createElement('li')
      li.textContent = `${site.badSite} → ${site.redirectTo} (${site.timeLimit}s)`
      list.appendChild(li)
    })
  })
}
