const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bwm', {
  getConfig: () => ipcRenderer.invoke('bwm:config'),
  generateInsight: (input) => ipcRenderer.invoke('bwm:insight', input),
  speak: (text) => ipcRenderer.invoke('bwm:tts', text)
});
