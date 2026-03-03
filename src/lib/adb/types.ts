// ADB Types for Renderer Process
// Re-exports types used by the UI

/** Device connection state */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'error';

/** Device info after connection */
export interface DeviceInfo {
  serial: string;
  product: string;
  model: string;
  device: string;
  features: string[];
}

/** Screen capture result */
export interface ScreenCapture {
  width: number;
  height: number;
  imageData: Uint8Array;
  base64: string;
  timestamp: number;
}

/** Common Android keycodes */
export const KEYCODE = {
  HOME: 3,
  BACK: 4,
  POWER: 26,
  MENU: 82,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  ENTER: 66,
  DELETE: 67,
  TAB: 61,
  RECENT_APPS: 187,
} as const;
