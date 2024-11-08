document.addEventListener('DOMContentLoaded', () => {
  carregarSitesConfigurados()
})

// Função para carregar e exibir a lista de sites configurados
function carregarSitesConfigurados() {
  chrome.storage.sync.get({ sites: [] }, data => {
    const configList = document.getElementById('configList')
    configList.innerHTML = ''

    data.sites.forEach((site, index) => {
      const listItem = document.createElement('li')
      listItem.classList.add(
        'bg-gray-700',
        'p-3',
        'rounded-md',
        'flex',
        'flex-col',
        'space-y-2'
      )

      const siteLabel = document.createElement('p')
      siteLabel.classList.add('text-sm', 'font-medium', 'text-gray-300')
      siteLabel.textContent = `${site.badSite} → ${site.redirectTo}`

      // Campo de entrada para o tempo
      const timeInput = document.createElement('input')
      timeInput.type = 'number'
      timeInput.value = site.timeLimit
      timeInput.classList.add(
        'w-full',
        'px-3',
        'py-2',
        'mt-2',
        'bg-gray-600',
        'rounded-md',
        'text-gray-200',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-500'
      )

      // Botão "Salvar"
      const saveButton = document.createElement('button')
      saveButton.textContent = 'Salvar'
      saveButton.classList.add(
        'w-full',
        'py-2',
        'bg-blue-500',
        'hover:bg-blue-600',
        'rounded-md',
        'font-semibold',
        'text-white',
        'transition',
        'duration-150',
        'ease-in-out'
      )

      saveButton.addEventListener('click', () => {
        atualizarTempoSite(index, timeInput.value)
      })

      // Botão de edição do URL de redirecionamento
      const editButton = document.createElement('button')
      editButton.innerHTML = '🖊'
      editButton.classList.add(
        'text-blue-400',
        'hover:text-blue-600',
        'transition',
        'duration-150',
        'ease-in-out',
        'mx-1',
        'text-xl', // Aumenta o tamanho do texto para o botão de editar
        'p-2', // Adiciona padding para aumentar o tamanho do botão
        'rounded-full' // Deixa o botão arredondado para melhor UX
      )

      editButton.addEventListener('click', () => {
        const novoRedirectTo = prompt(
          'Digite o novo URL de redirecionamento:',
          site.redirectTo
        )
        if (novoRedirectTo) {
          atualizarRedirectTo(index, novoRedirectTo)
        }
      })

      // Botão de exclusão do site
      const deleteButton = document.createElement('button')
      deleteButton.innerHTML = '🗑'
      deleteButton.classList.add(
        'text-red-400',
        'hover:text-red-600',
        'transition',
        'duration-150',
        'ease-in-out',
        'mx-1',
        'text-xl', // Aumenta o tamanho do texto para o botão de excluir
        'p-2', // Adiciona padding para aumentar o tamanho do botão
        'rounded-full' // Deixa o botão arredondado para melhor UX
      )

      deleteButton.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja excluir este site?')) {
          excluirSite(index)
        }
      })

      // Contêiner para os botões de edição e exclusão
      const buttonContainer = document.createElement('div')
      buttonContainer.classList.add('flex', 'justify-between', 'mt-2')
      buttonContainer.appendChild(editButton)
      buttonContainer.appendChild(deleteButton)

      listItem.appendChild(siteLabel)
      listItem.appendChild(timeInput)
      listItem.appendChild(saveButton)
      listItem.appendChild(buttonContainer)
      configList.appendChild(listItem)
    })
  })
}

// Função para atualizar o tempo de redirecionamento no armazenamento
function atualizarTempoSite(index, novoTempo) {
  chrome.storage.sync.get({ sites: [] }, data => {
    const sites = data.sites
    if (index >= 0 && index < sites.length) {
      sites[index].timeLimit = parseInt(novoTempo, 10)
      chrome.storage.sync.set({ sites }, () => {
        alert('Tempo atualizado com sucesso!')
      })
    }
  })
}

// Função para atualizar o URL de redirecionamento no armazenamento
function atualizarRedirectTo(index, novoRedirectTo) {
  chrome.storage.sync.get({ sites: [] }, data => {
    const sites = data.sites
    if (index >= 0 && index < sites.length) {
      sites[index].redirectTo = novoRedirectTo
      chrome.storage.sync.set({ sites }, () => {
        alert('URL de redirecionamento atualizado com sucesso!')
        carregarSitesConfigurados() // Recarrega a lista para mostrar a atualização
      })
    }
  })
}

// Função para excluir um site da lista
function excluirSite(index) {
  chrome.storage.sync.get({ sites: [] }, data => {
    const sites = data.sites
    if (index >= 0 && index < sites.length) {
      sites.splice(index, 1) // Remove o site da lista
      chrome.storage.sync.set({ sites }, () => {
        alert('Site excluído com sucesso!')
        carregarSitesConfigurados() // Recarrega a lista após exclusão
      })
    }
  })
}
