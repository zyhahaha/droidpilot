// Electron Preload Script - Exposes ADB APIs to the renderer process
import { contextBridge, ipcRenderer } from 'electron';

// Connection state change listeners
const connectionStateListeners = new Set<(state: string) => void>();

// Listen for connection state changes from main process
ipcRenderer.on('adb:connectionState', (_event, state: string) => {
  connectionStateListeners.forEach((listener) => listener(state));
});

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Device management
  requestDevice: () => ipcRenderer.invoke('adb:requestDevice'),
  connect: () => ipcRenderer.invoke('adb:connect'),
  disconnect: () => ipcRenderer.invoke('adb:disconnect'),

  // Screen capture
  captureScreen: () => ipcRenderer.invoke('adb:captureScreen'),

  // Input controls
  tap: (x: number, y: number) => ipcRenderer.invoke('adb:tap', x, y),
  swipe: (x1: number, y1: number, x2: number, y2: number, duration?: number) =>
    ipcRenderer.invoke('adb:swipe', x1, y1, x2, y2, duration),
  longPress: (x: number, y: number, duration?: number) =>
    ipcRenderer.invoke('adb:longPress', x, y, duration),
  typeText: (text: string) => ipcRenderer.invoke('adb:typeText', text),
  keyEvent: (keycode: number) => ipcRenderer.invoke('adb:keyEvent', keycode),

  // Navigation
  home: () => ipcRenderer.invoke('adb:home'),
  back: () => ipcRenderer.invoke('adb:back'),
  recentApps: () => ipcRenderer.invoke('adb:recentApps'),

  // Shell
  shell: (command: string) => ipcRenderer.invoke('adb:shell', command),

  // Connection state
  onConnectionStateChange: (callback: (state: string) => void) => {
    connectionStateListeners.add(callback);
    // Return unsubscribe function
    return () => {
      connectionStateListeners.delete(callback);
    };
  },
  getConnectionState: () => ipcRenderer.invoke('adb:getConnectionState'),

  // Utility
  isSupported: () => ipcRenderer.invoke('adb:isSupported'),

  // Skills - Agent Skills 按需加载
  listSkills: () => ipcRenderer.invoke('skills:list'),
  readSkillFile: (skillPath: string, maxLength?: number) => 
    ipcRenderer.invoke('skills:readFile', skillPath, maxLength),
});
