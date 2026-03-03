// Electron Main Process
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { AdbManager } from './adb';

let mainWindow: BrowserWindow | null = null;
let adbManager: AdbManager | null = null;

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#0a0b0f',
    title: 'DroidPilot - Android 设备自动化控制',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/icon.png'),
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Clean up ADB connection when window is closed
    if (adbManager) {
      adbManager.disconnect().catch(console.error);
      adbManager = null;
    }
  });
}

// Initialize IPC handlers for ADB operations
function initAdbHandlers() {
  // Check if ADB is supported
  ipcMain.handle('adb:isSupported', () => {
    return AdbManager.isSupported();
  });

  // Request device access
  ipcMain.handle('adb:requestDevice', async () => {
    if (!adbManager) {
      adbManager = new AdbManager();
    }
    return await adbManager.requestDevice();
  });

  // Connect to device
  ipcMain.handle('adb:connect', async (event) => {
    if (!adbManager) {
      adbManager = new AdbManager((state) => {
        // Send connection state updates to renderer
        event.sender.send('adb:connectionState', state);
      });
    }
    return await adbManager.connect();
  });

  // Disconnect from device
  ipcMain.handle('adb:disconnect', async () => {
    if (adbManager) {
      await adbManager.disconnect();
    }
    return { success: true };
  });

  // Capture screen
  ipcMain.handle('adb:captureScreen', async () => {
    if (!adbManager) throw new Error('设备未连接');
    return await adbManager.captureScreen();
  });

  // Tap
  ipcMain.handle('adb:tap', async (_event, x: number, y: number) => {
    if (!adbManager) throw new Error('设备未连接');
    await adbManager.tap(x, y);
  });

  // Swipe
  ipcMain.handle('adb:swipe', async (_event, x1: number, y1: number, x2: number, y2: number, duration?: number) => {
    if (!adbManager) throw new Error('设备未连接');
    await adbManager.swipe(x1, y1, x2, y2, duration);
  });

  // Long press
  ipcMain.handle('adb:longPress', async (_event, x: number, y: number, duration?: number) => {
    if (!adbManager) throw new Error('设备未连接');
    await adbManager.longPress(x, y, duration);
  });

  // Type text
  ipcMain.handle('adb:typeText', async (_event, text: string) => {
    if (!adbManager) throw new Error('设备未连接');
    await adbManager.typeText(text);
  });

  // Key event
  ipcMain.handle('adb:keyEvent', async (_event, keycode: number) => {
    if (!adbManager) throw new Error('设备未连接');
    await adbManager.keyEvent(keycode);
  });

  // Home button
  ipcMain.handle('adb:home', async () => {
    if (!adbManager) throw new Error('设备未连接');
    await adbManager.home();
  });

  // Back button
  ipcMain.handle('adb:back', async () => {
    if (!adbManager) throw new Error('设备未连接');
    await adbManager.back();
  });

  // Recent apps
  ipcMain.handle('adb:recentApps', async () => {
    if (!adbManager) throw new Error('设备未连接');
    await adbManager.recentApps();
  });

  // Shell command
  ipcMain.handle('adb:shell', async (_event, command: string) => {
    if (!adbManager) throw new Error('设备未连接');
    return await adbManager.shell(command);
  });

  // Get connection state
  ipcMain.handle('adb:getConnectionState', async () => {
    if (!adbManager) return 'disconnected';
    return adbManager.state;
  });
}

// Skills IPC handlers
function initSkillsHandlers() {
  const skillsPath = path.join(app.getAppPath(), '.agents', 'skills');

  // List all skill directories
  ipcMain.handle('skills:list', async () => {
    try {
      if (!fs.existsSync(skillsPath)) {
        return [];
      }
      const dirs = fs.readdirSync(skillsPath, { withFileTypes: true });
      return dirs
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    } catch (error) {
      console.error('[Skills] Failed to list skills:', error);
      return [];
    }
  });

  // Read a skill file (SKILL.md or other resources)
  ipcMain.handle('skills:readFile', async (_event, skillPath: string, maxLength?: number) => {
    try {
      const fullPath = path.join(skillsPath, skillPath);
      
      // Security check: ensure path is within skills directory
      const resolvedPath = path.resolve(fullPath);
      if (!resolvedPath.startsWith(skillsPath)) {
        throw new Error('Invalid skill path');
      }

      if (!fs.existsSync(resolvedPath)) {
        return null;
      }

      let content = fs.readFileSync(resolvedPath, 'utf-8');
      
      // If maxLength is specified, only return that many characters
      if (maxLength && content.length > maxLength) {
        content = content.slice(0, maxLength);
      }

      return content;
    } catch (error) {
      console.error('[Skills] Failed to read file:', error);
      return null;
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  initAdbHandlers();
  initSkillsHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Clean up ADB
  if (adbManager) {
    adbManager.disconnect().catch(console.error);
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault();
  callback(true);
});
