document.addEventListener('DOMContentLoaded', () => {
  carregarSitesConfigurados()
  document
    .getElementById('addRuleButton')
    .addEventListener('click', abrirPopupAdicionar)
})

// Função para carregar e exibir a lista de sites configurados
function carregarSitesConfigurados() {
  chrome.storage.sync.get({ sites: [], groups: [] }, data => {
    const configList = document.getElementById('configList')
    configList.innerHTML = ''

    data.sites.forEach((site, index) => {
      // Cria a linha da tabela para cada regra
      const row = document.createElement('tr')
      row.classList.add('hover:bg-gray-700')

      // Coluna de Ativo
      const activeCell = document.createElement('td')
      activeCell.classList.add('py-2')
      const activeSwitch = document.createElement('input')
      activeSwitch.type = 'checkbox'
      activeSwitch.checked = site.active
      activeSwitch.addEventListener('change', () => {
        atualizarStatusAtivo(index, activeSwitch.checked)
      })
      activeCell.appendChild(activeSwitch)

      // Coluna de Nome
      const nameCell = document.createElement('td')
      nameCell.classList.add('py-2')
      nameCell.textContent = site.name

      // Coluna de Grupo
      const groupCell = document.createElement('td')
      groupCell.classList.add('py-2')
      groupCell.textContent = site.group || '-'

      // Coluna de URL Fragmento
      const urlCell = document.createElement('td')
      urlCell.classList.add('py-2')
      urlCell.textContent = site.badSite

      // Coluna de Tempo Limite
      const timeLimitCell = document.createElement('td')
      timeLimitCell.classList.add('py-2')
      timeLimitCell.textContent = site.timeLimit

      // Coluna de URL de Redirect
      const redirectCell = document.createElement('td')
      redirectCell.classList.add('py-2')
      redirectCell.textContent = site.redirectTo

      // Botão de Excluir (visível apenas ao passar o mouse)
      const deleteCell = document.createElement('td')
      deleteCell.classList.add('py-2', 'text-right')
      const deleteButton = document.createElement('button')
      deleteButton.innerHTML = '🗑'
      deleteButton.classList.add(
        'text-red-400',
        'hover:text-red-600',
        'transition',
        'duration-150',
        'ease-in-out'
      )
      deleteButton.addEventListener('click', event => {
        event.stopPropagation() // Prevenir o clique de abrir o modal
        if (confirm('Tem certeza que deseja excluir esta regra?')) {
          excluirRegra(index)
        }
      })

      deleteCell.appendChild(deleteButton)

      // Adiciona evento de clique para abrir o popup de edição
      row.addEventListener('click', () => {
        abrirPopupEdicao(site, index)
      })

      row.appendChild(activeCell)
      row.appendChild(nameCell)
      row.appendChild(groupCell)
      row.appendChild(urlCell)
      row.appendChild(timeLimitCell)
      row.appendChild(redirectCell)
      row.appendChild(deleteCell)
      configList.appendChild(row)
    })
  })
}

// Função para abrir um popup de edição
function abrirPopupEdicao(site, index) {
  chrome.storage.sync.get({ groups: [] }, data => {
    const popup = criarPopup('Edit Rule', site, data.groups)

    // Botão salvar edição
    document.getElementById('saveEdit').addEventListener('click', () => {
      const updatedSite = obterDadosDoPopup()
      atualizarRegra(index, updatedSite)
      fecharPopup(popup)
    })

    // Botão cancelar
    document.getElementById('cancelEdit').addEventListener('click', () => {
      fecharPopup(popup)
    })
  })
}

// Função para abrir um popup para adicionar uma nova regra
function abrirPopupAdicionar() {
  chrome.storage.sync.get({ groups: [] }, data => {
    const popup = criarPopup(
      'Add New Rule',
      {
        name: '',
        badSite: '',
        timeLimit: 60,
        redirectTo: '',
        active: false,
        group: '',
      },
      data.groups
    )

    // Botão salvar nova regra
    document.getElementById('saveEdit').addEventListener('click', () => {
      const newSite = obterDadosDoPopup()
      adicionarRegra(newSite)
      fecharPopup(popup)
    })

    // Botão cancelar
    document.getElementById('cancelEdit').addEventListener('click', () => {
      fecharPopup(popup)
    })
  })
}

// Função para criar um popup de edição/adicionar
function criarPopup(titulo, site, groups) {
  const popup = document.createElement('div')
  popup.classList.add(
    'fixed',
    'top-0',
    'left-0',
    'w-full',
    'h-full',
    'bg-gray-900',
    'bg-opacity-75',
    'flex',
    'justify-center',
    'items-center'
  )

  const popupContent = document.createElement('div')
  popupContent.classList.add('bg-gray-800', 'p-6', 'rounded-md', 'w-96')

  // Criação das opções do grupo com a seleção do grupo atual
  const groupOptions = groups
    .map(group => {
      const isSelected = site.group === group ? 'selected' : ''
      return `<option value="${group}" ${isSelected}>${group}</option>`
    })
    .join('')

  // HTML do conteúdo do popup
  popupContent.innerHTML = `
    <h2 class="text-lg font-semibold mb-4">${titulo}</h2>
    <label class="block mb-2">Name</label>
    <input type="text" value="${
      site.name
    }" id="editName" class="w-full p-2 mb-4 bg-gray-700 rounded-md">
    <label class="block mb-2">Group</label>
    <select id="editGroup" class="w-full p-2 mb-4 bg-gray-700 rounded-md">
      <option value="">-- Select Group --</option>
      ${groupOptions}
    </select>
    <input type="text" id="newGroup" placeholder="Or create new group" class="w-full p-2 mb-4 bg-gray-700 rounded-md">
    <label class="block mb-2">URL Fragment</label>
    <input type="text" value="${
      site.badSite
    }" id="editBadSite" class="w-full p-2 mb-4 bg-gray-700 rounded-md">
    <label class="block mb-2">Time Limit (seconds)</label>
    <input type="number" value="${
      site.timeLimit
    }" id="editTimeLimit" class="w-full p-2 mb-4 bg-gray-700 rounded-md">
    <label class="block mb-2">Redirect URL</label>
    <input type="text" value="${
      site.redirectTo
    }" id="editRedirectTo" class="w-full p-2 mb-4 bg-gray-700 rounded-md">
    <label class="block mb-2">Active</label>
    <input type="checkbox" id="editActive" ${
      site.active ? 'checked' : ''
    } class="mb-4">

    <div class="flex justify-end space-x-4">
      <button id="cancelEdit" class="px-4 py-2 bg-gray-600 text-white rounded-md">Cancel</button>
      <button id="saveEdit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Save</button>
    </div>
  `

  popup.appendChild(popupContent)
  document.body.appendChild(popup)

  return popup
}

// Função para obter os dados do popup
function obterDadosDoPopup() {
  const groupSelect = document.getElementById('editGroup').value
  const newGroup = document.getElementById('newGroup').value

  let group = groupSelect
  if (newGroup) {
    group = newGroup
    adicionarGrupo(newGroup)
  }

  return {
    name: document.getElementById('editName').value,
    badSite: document.getElementById('editBadSite').value,
    timeLimit: parseInt(document.getElementById('editTimeLimit').value, 10),
    redirectTo: document.getElementById('editRedirectTo').value,
    active: document.getElementById('editActive').checked,
    group: group,
  }
}

// Função para adicionar uma nova regra ao armazenamento
function adicionarRegra(newSite) {
  chrome.storage.sync.get({ sites: [] }, data => {
    data.sites.push(newSite)
    chrome.storage.sync.set({ sites: data.sites }, () => {
      alert('Nova regra adicionada com sucesso!')
      carregarSitesConfigurados()
    })
  })
}

// Função para adicionar um novo grupo ao armazenamento
function adicionarGrupo(newGroup) {
  chrome.storage.sync.get({ groups: [] }, data => {
    if (!data.groups.includes(newGroup)) {
      data.groups.push(newGroup)
      chrome.storage.sync.set({ groups: data.groups })
    }
  })
}

// Função para atualizar uma regra no armazenamento
function atualizarRegra(index, updatedSite) {
  chrome.storage.sync.get({ sites: [] }, data => {
    data.sites[index] = updatedSite
    chrome.storage.sync.set({ sites: data.sites }, () => {
      alert('Regra atualizada com sucesso!')
      carregarSitesConfigurados()
    })
  })
}

// Função para atualizar o status de ativo
function atualizarStatusAtivo(index, isActive) {
  chrome.storage.sync.get({ sites: [] }, data => {
    data.sites[index].active = isActive
    chrome.storage.sync.set({ sites: data.sites }, () => {
      carregarSitesConfigurados()
    })
  })
}

// Função para excluir uma regra do armazenamento
function excluirRegra(index) {
  chrome.storage.sync.get({ sites: [] }, data => {
    data.sites.splice(index, 1)
    chrome.storage.sync.set({ sites: data.sites }, () => {
      alert('Regra excluída com sucesso!')
      carregarSitesConfigurados()
    })
  })
}

// Função para fechar o popup
function fecharPopup(popup) {
  document.body.removeChild(popup)
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
