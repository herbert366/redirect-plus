document.addEventListener('DOMContentLoaded', () => {
  const openConfigBtn = document.getElementById('openConfig')
  if (openConfigBtn) {
    openConfigBtn.addEventListener('click', () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('src/config.html'),
      })
    })
  } else {
    console.error("Elemento com ID 'openConfig' não encontrado.")
  }
})
