/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vite/client" />

export {};

// Electron API type declarations
declare global {
  interface Window {
    electronAPI: {
      // Device management
      requestDevice: () => Promise<{ serial: string; product: string; model: string }>;
      connect: () => Promise<{ serial: string; product: string; model: string; device: string; features: string[] }>;
      disconnect: () => Promise<void>;
      
      // Screen capture
      captureScreen: () => Promise<{ base64: string; width: number; height: number }>;
      
      // Input controls
      tap: (x: number, y: number) => Promise<void>;
      swipe: (x1: number, y1: number, x2: number, y2: number, duration?: number) => Promise<void>;
      longPress: (x: number, y: number, duration?: number) => Promise<void>;
      typeText: (text: string) => Promise<void>;
      keyEvent: (keycode: number) => Promise<void>;
      
      // Navigation
      home: () => Promise<void>;
      back: () => Promise<void>;
      recentApps: () => Promise<void>;
      
      // Shell
      shell: (command: string) => Promise<string>;
      
      // Connection state
      onConnectionStateChange: (callback: (state: string) => void) => () => void;
      getConnectionState: () => Promise<string>;
      
      // Utility
      isSupported: () => boolean;
      
      // Skills - Agent Skills 按需加载
      listSkills: () => Promise<string[]>;
      readSkillFile: (skillPath: string, maxLength?: number) => Promise<string | null>;
    };
  }
}
