const path = require('node:path');
const { app, BrowserWindow, ipcMain, session } = require('electron');
const { bindSmartSpectraIpc } = require('@smartspectra/node-sdk/main');
const { loadEnv, getConfig } = require('./config');
const { generateInsight } = require('./insights');
const { synthesize } = require('./tts');

function isLocalPage(event) {
  const url = event.senderFrame?.url || '';
  return url.startsWith('file://');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#0e1620',
    autoHideMenuBar: true,
    webPreferences: {
      preload: require.resolve('@smartspectra/node-sdk/preload'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  bindSmartSpectraIpc(win);

  win.webContents.on('before-input-event', (event, input) => {
    const isF12 = input.type === 'keyDown' && input.key === 'F12';
    const isCombo = input.type === 'keyDown' && input.control && input.shift && input.key.toLowerCase() === 'i';
    if (isF12 || isCombo) win.webContents.toggleDevTools();
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());
  win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(() => {
  loadEnv();

  session.defaultSession.registerPreloadScript({
    type: 'frame',
    filePath: path.join(__dirname, 'preload.js')
  });

  ipcMain.handle('bwm:config', (event) => {
    if (!isLocalPage(event)) return null;
    const { presageKey, ai, tts } = getConfig();
    return { presageKey, aiEnabled: ai.enabled, aiModel: ai.enabled ? ai.model : null, ttsEnabled: Boolean(tts.apiKey) };
  });

  ipcMain.handle('bwm:insight', (event, input) => {
    if (!isLocalPage(event)) return null;
    return generateInsight(input, getConfig().ai);
  });

  ipcMain.handle('bwm:tts', (event, text) => {
    if (!isLocalPage(event)) return null;
    return synthesize(text, getConfig().tts);
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const url = details?.requestingUrl || webContents.getURL();
    const mediaTypes = details?.mediaTypes || [];
    const isLocal = url.startsWith('file://');
    const isCamera = mediaTypes.length === 1 && mediaTypes[0] === 'video';
    callback(permission === 'media' && isLocal && isCamera);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
