const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('win-minimize'),
  maximize: () => ipcRenderer.invoke('win-maximize'),
  close: () => ipcRenderer.invoke('win-close'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (data) => ipcRenderer.invoke('save-file-dialog', data),
});
