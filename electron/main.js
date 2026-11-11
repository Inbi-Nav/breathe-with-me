
const path = require('node:path');
const  {app, BrowserWindow} = require('electron');
const {bindSmartSpectraIpc} = require('@smartspectra/node-sdk/main');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#111827',
    webPreferences: {
        preload: require.resolve('@smartspectra/node-sdk/preload'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
    }
  });
  
    bindSmartSpectraIpc(win);
    win.webContents.setWindowOpenHandler(() => ({
        action: 'deny'
    }));

    win.webContents.on('will-navigate', (event) => {
        event.preventDefault();
    });

    win.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
