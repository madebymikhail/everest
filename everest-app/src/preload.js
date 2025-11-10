const { contextBridge, ipcRenderer } = require('electron')

const BASE_URL = 'http://127.0.0.1:39245'

async function apiCall(route, options = {}) {
  const res = await fetch(`${BASE_URL}${route}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

contextBridge.exposeInMainWorld('api', {
  // Overlay controls
  hideWindow: () => ipcRenderer.send('hide-window'),

  // Everest API
  health: () => apiCall('/health'),
  modelsList: () => apiCall('/models_list'),
  config: () => apiCall('/config'),
  editConfig: (body) => apiCall('/edit_config', { method: 'POST', body: JSON.stringify(body) }),
  prompt: (body) => apiCall('/prompt', { method: 'POST', body: JSON.stringify(body) }),
  typeText: (body) => apiCall('/type', { method: 'POST', body: JSON.stringify(body) }),
  cancelTyping: () => apiCall('/cancel_typing', { method: 'POST' }),
  typingStatus: () => apiCall('/typing_status'),
  shutdown: () => apiCall('/shutdown', { method: 'POST' }),
})
