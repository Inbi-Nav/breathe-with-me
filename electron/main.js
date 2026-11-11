
const path = require('node:path');
const  {app, BrowserWindow, session} = require('electron');
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
    session.defaultSession.setPermissionRequestHandler(
        (webContents, permission, callback, details) => {
            const url = details?.requestingUrl || webContents.getURL();
            const mediaTypes = details?.mediaTypes || [];
            const isLocalPage = url.startsWith('file://');
            const isCamera = mediaTypes.length === 1 && mediaTypes[0] === 'video';
            callback( permission === 'media' && isLocalPage && isCamera);
        }
    ); createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
