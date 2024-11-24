document.addEventListener('DOMContentLoaded', () => {
  carregarSitesConfigurados()
  document
    .getElementById('addRuleButton')
    .addEventListener('click', abrirPopupAdicionar)
})

// Função para carregar e exibir a lista de sites configurados
function carregarSitesConfigurados() {
  chrome.storage.sync.get({ sites: [], tags: [] }, data => {
    const configList = document.getElementById('configList')
    configList.innerHTML = ''

    data.sites.forEach((site, index) => {
      // Cria a linha da tabela para cada regra
      const row = document.createElement('tr')
      row.classList.add('hover:bg-gray-700')

      // Coluna de Ativo (Toggle Switch)
      const activeCell = document.createElement('td')
      activeCell.classList.add('py-2')

      const toggleSwitch = document.createElement('label')
      toggleSwitch.classList.add('switch')
      toggleSwitch.innerHTML = `
        <input type="checkbox" ${site.active ? 'checked' : ''}>
        <span class="slider round"></span>
      `

      // Evita que o popup seja aberto ao clicar no toggle switch
      toggleSwitch.querySelector('input').addEventListener('click', event => {
        event.stopImmediatePropagation() // Previne que o evento de clique abra o popup e para toda propagação
        atualizarStatusAtivo(index, event.target.checked) // Atualiza o status no armazenamento
      })

      activeCell.appendChild(toggleSwitch)

      // Coluna de Nome
      const nameCell = document.createElement('td')
      nameCell.classList.add('py-2')
      nameCell.textContent = site.name

      // Coluna de Tag
      const tagCell = document.createElement('td')
      tagCell.classList.add('py-2')
      tagCell.textContent = site.tag || '-'

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

      // Adiciona evento de clique para abrir o popup de edição, exceto no toggle
      row.addEventListener('click', event => {
        // Garante que o clique no toggle não abra o modal
        if (!event.target.closest('.switch')) {
          abrirPopupEdicao(site, index)
        }
      })

      row.appendChild(activeCell)
      row.appendChild(nameCell)
      row.appendChild(tagCell)
      row.appendChild(urlCell)
      row.appendChild(timeLimitCell)
      row.appendChild(redirectCell)
      row.appendChild(deleteCell)
      configList.appendChild(row)
    })
  })
}

// Função para abrir um popup de edição/adicionar
function criarPopup(titulo, site, tags) {
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
  popupContent.classList.add(
    'bg-gray-800',
    'p-6',
    'rounded-md',
    'w-96',
    'relative'
  )

  // Criação das opções do tag com a seleção do tag atual
  const tagOptions = tags
    .map(tag => {
      const isSelected = site.tag === tag ? 'selected' : ''
      return `<option value="${tag}" ${isSelected}>${tag}</option>`
    })
    .join('')

  popupContent.innerHTML = `
    <!-- Botão de fechar no canto superior direito -->
    <button id="closePopup" class="absolute top-2 right-2 text-gray-400 hover:text-white">
      ✖
    </button>
    <h2 class="text-lg font-semibold mb-4">${titulo}</h2>
    <label class="block mb-2">Name</label>
    <input type="text" value="${
      site.name
    }" id="editName" class="w-full p-2 mb-4 bg-gray-700 rounded-md">
    <label class="block mb-2">Tag</label>
    <select id="editTag" class="w-full p-2 mb-4 bg-gray-700 rounded-md">
      <option value="">-- Select Tag --</option>
      ${tagOptions}
    </select>
    <input type="text" id="newTag" placeholder="Or create new tag" class="w-full p-2 mb-4 bg-gray-700 rounded-md">
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

  // Evento para fechar o popup ao clicar no botão "X"
  document.getElementById('closePopup').addEventListener('click', () => {
    fecharPopup(popup)
  })

  return popup
}

// Função para atualizar uma regra no armazenamento
function atualizarRegra(index, updatedSite, callback) {
  chrome.storage.sync.get({ sites: [] }, data => {
    data.sites[index] = updatedSite
    chrome.storage.sync.set({ sites: data.sites }, () => {
      console.log('Regra atualizada com sucesso!')
      if (callback) callback() // Executa o callback, se fornecido
    })
  })
}

// Função para abrir um popup de edição
function abrirPopupEdicao(site, index) {
  chrome.storage.sync.get({ tags: [] }, data => {
    const popup = criarPopup('Edit Rule', site, data.tags)

    // Botão salvar edição
    document.getElementById('saveEdit').addEventListener('click', () => {
      const updatedSite = obterDadosDoPopup()
      atualizarRegra(index, updatedSite, () => {
        alert('As mudanças foram salvas com sucesso!')
        fecharPopup(popup)
        carregarSitesConfigurados() // Recarrega a lista para garantir a atualização imediata no DOM
      })
    })

    // Botão cancelar
    document.getElementById('cancelEdit').addEventListener('click', () => {
      fecharPopup(popup)
    })
  })
}

// Função para abrir um popup para adicionar uma nova regra
function abrirPopupAdicionar() {
  chrome.storage.sync.get({ tags: [] }, data => {
    const popup = criarPopup(
      'Add New Rule',
      {
        name: '',
        badSite: '',
        timeLimit: 60,
        redirectTo: '',
        active: true, // Define o estado padrão como ativo
        tag: '',
      },
      data.tags
    )

    // Botão salvar nova regra
    document.getElementById('saveEdit').addEventListener('click', () => {
      const newSite = obterDadosDoPopup()
      adicionarRegra(newSite, () => {
        alert('Nova regra adicionada com sucesso!')
        fecharPopup(popup)
        carregarSitesConfigurados() // Recarrega a lista para garantir que a nova regra apareça no DOM
      })
    })

    // Botão cancelar
    document.getElementById('cancelEdit').addEventListener('click', () => {
      fecharPopup(popup)
    })
  })
}

// Função para fechar o popup
function fecharPopup(popup) {
  document.body.removeChild(popup)
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

// Função para obter os dados do popup
function obterDadosDoPopup() {
  const tagSelect = document.getElementById('editTag').value
  const newTag = document.getElementById('newTag').value

  let tag = tagSelect
  if (newTag) {
    tag = newTag
    adicionarTag(newTag)
  }

  return {
    name: document.getElementById('editName').value,
    badSite: document.getElementById('editBadSite').value,
    timeLimit: parseInt(document.getElementById('editTimeLimit').value, 10),
    redirectTo: document.getElementById('editRedirectTo').value,
    active: document.getElementById('editActive').checked,
    tag: tag,
  }
}

// Função para adicionar uma nova regra ao armazenamento
function adicionarRegra(newSite, callback) {
  chrome.storage.sync.get({ sites: [] }, data => {
    data.sites.push(newSite)
    chrome.storage.sync.set({ sites: data.sites }, () => {
      console.log('Nova regra adicionada com sucesso!')
      if (callback) callback() // Executa o callback, se fornecido
    })
  })
}

// Função para adicionar uma nova tag ao armazenamento
function adicionarTag(newTag) {
  chrome.storage.sync.get({ tags: [] }, data => {
    if (!data.tags.includes(newTag)) {
      data.tags.push(newTag)
      chrome.storage.sync.set({ tags: data.tags })
    }
  })
}

// CSS para o Toggle Switch
const style = document.createElement('style')
style.textContent = `
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4caf50; /* Cor verde para indicar ativo */
}

input:focus + .slider {
  box-shadow: 0 0 1px #4caf50;
}

input:checked + .slider:before {
  transform: translateX(20px);
}
`
document.head.appendChild(style)

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
