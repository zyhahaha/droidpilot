// Device State Management with Zustand
// Adapted for Electron IPC communication

import { create } from 'zustand';

type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'error';

interface DeviceInfo {
  serial: string;
  product: string;
  model: string;
  device: string;
  features: string[];
}

interface DeviceState {
  // Connection
  connectionState: ConnectionState;
  deviceInfo: DeviceInfo | null;
  error: string | null;

  // Screen
  currentScreen: string | null; // base64 PNG
  screenTimestamp: number;
  isCapturing: boolean;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  captureScreen: () => Promise<string | null>;
  executeShell: (command: string) => Promise<string>;

  // Manual controls
  tap: (x: number, y: number) => Promise<void>;
  swipe: (x1: number, y1: number, x2: number, y2: number, duration?: number) => Promise<void>;
  typeText: (text: string) => Promise<void>;
  pressHome: () => Promise<void>;
  pressBack: () => Promise<void>;
  pressRecent: () => Promise<void>;

  // Screen update callback
  setScreen: (base64: string) => void;
  clearError: () => void;
}

export const useDeviceStore = create<DeviceState>((set, get) => {
  // Subscribe to connection state changes from main process
  let unsubscribe: (() => void) | null = null;

  return {
    connectionState: 'disconnected',
    deviceInfo: null,
    error: null,
    currentScreen: null,
    screenTimestamp: 0,
    isCapturing: false,

    connect: async () => {
      try {
        set({ error: null, connectionState: 'connecting' });

        // Subscribe to connection state changes
        if (unsubscribe) unsubscribe();
        unsubscribe = window.electronAPI.onConnectionStateChange((state) => {
          set({ connectionState: state as ConnectionState });
        });

        // Connect via IPC
        const info = await window.electronAPI.connect();
        set({
          deviceInfo: {
            serial: info.serial,
            product: info.product,
            model: info.model,
            device: info.device,
            features: info.features,
          },
          connectionState: 'connected',
        });

        // Auto-capture first screenshot
        const capture = await window.electronAPI.captureScreen();
        set({
          currentScreen: capture.base64,
          screenTimestamp: Date.now(),
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        set({ error: msg, connectionState: 'error' });
        throw error;
      }
    },

    disconnect: async () => {
      try {
        await window.electronAPI.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      set({
        connectionState: 'disconnected',
        deviceInfo: null,
        currentScreen: null,
        error: null,
      });
    },

    captureScreen: async () => {
      if (get().connectionState !== 'connected') return null;
      set({ isCapturing: true });
      try {
        const capture = await window.electronAPI.captureScreen();
        set({
          currentScreen: capture.base64,
          screenTimestamp: Date.now(),
          isCapturing: false,
        });
        return capture.base64;
      } catch (error) {
        set({ isCapturing: false });
        throw error;
      }
    },

    executeShell: async (command: string) => {
      return await window.electronAPI.shell(command);
    },

    tap: async (x, y) => {
      await window.electronAPI.tap(x, y);
    },

    swipe: async (x1, y1, x2, y2, duration) => {
      await window.electronAPI.swipe(x1, y1, x2, y2, duration);
    },

    typeText: async (text) => {
      await window.electronAPI.typeText(text);
    },

    pressHome: async () => {
      await window.electronAPI.home();
    },

    pressBack: async () => {
      await window.electronAPI.back();
    },

    pressRecent: async () => {
      await window.electronAPI.recentApps();
    },

    setScreen: (base64: string) => {
      set({ currentScreen: base64, screenTimestamp: Date.now() });
    },

    clearError: () => set({ error: null }),
  };
});
