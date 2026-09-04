const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless for Windows 11 tabs & titlebar
    title: 'notepadEZ',
    icon: path.join(__dirname, '../build/icon.ico'),
    transparent: true,
    vibrancy: 'acrylic',
    backgroundMaterial: 'acrylic',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const devUrl = 'http://localhost:5174';
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL(devUrl).catch(() => {
      // Fallback port 5173 if 5174 not used
      mainWindow.loadURL('http://localhost:5173');
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window Control IPC Handlers
ipcMain.handle('win-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('win-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('win-close', () => {
  if (mainWindow) mainWindow.close();
});

// Native File IPC Handlers
ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Documents (*.txt)', extensions: ['txt'] },
      { name: 'Markdown Files (*.md)', extensions: ['md'] },
      { name: 'HTML Web Page (*.html)', extensions: ['html', 'htm'] },
      { name: 'JSON Data (*.json)', extensions: ['json'] },
      { name: 'CSV Spreadsheet (*.csv)', extensions: ['csv'] },
      { name: 'All Files (*.*)', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, filename: path.basename(filePath), content };
});

ipcMain.handle('save-file-dialog', async (event, { content, defaultName, filePath }) => {
  if (!mainWindow) return null;
  let targetPath = filePath;

  if (!targetPath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName || 'Untitled.txt',
      filters: [
        { name: 'Text Documents (*.txt)', extensions: ['txt'] },
        { name: 'Markdown Files (*.md)', extensions: ['md'] },
        { name: 'HTML Web Page (*.html)', extensions: ['html', 'htm'] },
        { name: 'JSON Data (*.json)', extensions: ['json'] },
        { name: 'CSV Spreadsheet (*.csv)', extensions: ['csv'] },
        { name: 'All Files (*.*)', extensions: ['*'] },
      ],
    });
    if (result.canceled || !result.filePath) return null;
    targetPath = result.filePath;
  }

  fs.writeFileSync(targetPath, content, 'utf-8');
  return { filePath: targetPath, filename: path.basename(targetPath) };
});
