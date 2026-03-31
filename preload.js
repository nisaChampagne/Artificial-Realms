const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // AI
  sendToAI:        (messages, apiKey, model, provider) => ipcRenderer.invoke('ai:chat', messages, apiKey, model, provider),
  generatePortrait: (prompt, apiKey)                   => ipcRenderer.invoke('ai:image', prompt, apiKey),
  pingProvider:     (provider, apiKey, model)          => ipcRenderer.invoke('provider:ping', provider, apiKey, model),

  // Saves
  saveGame:   (slot, data) => ipcRenderer.invoke('save:write', slot, data),
  loadGame:   (slot)       => ipcRenderer.invoke('save:read', slot),
  listSaves:  ()           => ipcRenderer.invoke('save:list'),
  deleteSave: (slot)       => ipcRenderer.invoke('save:delete', slot),

  // Settings
  getSettings:  ()         => ipcRenderer.invoke('settings:get'),
  saveSettings: (s)        => ipcRenderer.invoke('settings:set', s),

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:version'),

  // Window
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow:    () => ipcRenderer.send('window:close'),

  // Auto-update
  checkForUpdates:  ()    => ipcRenderer.invoke('update:check'),
  openReleasePage:  (url) => ipcRenderer.invoke('update:open-release', url),
});
