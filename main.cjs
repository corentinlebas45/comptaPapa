const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (err) {
}

const DATA_FILE_NAME = 'donnees-comptes.json';
const userDataPath = app.isPackaged
  ? path.dirname(app.getPath('exe'))
  : app.getAppPath();
const dataFilePath = path.join(userDataPath, DATA_FILE_NAME);

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    autoHideMenuBar: true,
  });

  const indexPath = app.isPackaged
    ? path.join(__dirname, 'dist', 'index.html')
    : path.join(__dirname, 'index.html');
  mainWindow.loadFile(indexPath);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}


ipcMain.handle('save-data', async (event, encodedData) => {
  try {
    await fs.writeFile(dataFilePath, encodedData, 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving data:', err);
    return false;
  }
});

ipcMain.handle('load-data', async () => {
  try {
    const encodedData = await fs.readFile(dataFilePath, 'utf-8');
    return encodedData;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    console.error('Error loading data:', err);
    return null;
  }
});

ipcMain.handle('get-api-key', () => {
  return process.env.API_KEY || '';
});


app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
