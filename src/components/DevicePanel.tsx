import { useDeviceStore } from '../store/deviceStore';
import {
  Smartphone,
  Unplug,
  Usb,
  Loader2,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function DevicePanel() {
  const {
    connectionState,
    deviceInfo,
    error,
    connect,
    disconnect,
    clearError,
  } = useDeviceStore();

  // In Electron, ADB is always supported
  const isSupported = true;

  const stateConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    disconnected: {
      color: 'text-gray-500',
      label: '未连接',
      icon: <WifiOff className="w-3 h-3" />,
    },
    connecting: {
      color: 'text-amber-400',
      label: '正在连接...',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    authenticating: {
      color: 'text-amber-400',
      label: '认证中...',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    connected: {
      color: 'text-emerald-400',
      label: '已连接',
      icon: <Wifi className="w-3 h-3" />,
    },
    error: {
      color: 'text-red-400',
      label: '连接错误',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
  };

  const state = stateConfig[connectionState] ?? stateConfig.disconnected;

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            设备
          </span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${state.color}`}>
          {state.icon}
          <span>{state.label}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
            {error.includes('USB_CLAIM_FAILED') ? (
              <>
                <div className="flex items-center gap-2 font-medium mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  USB 接口被占用
                </div>
                <p className="text-red-400/80 mb-2">
                  无法连接设备，USB 接口已被其他程序占用。请尝试：
                </p>
                <ol className="list-decimal list-inside space-y-1 text-red-400/70 mb-2">
                  <li>在终端运行 <code className="bg-red-500/20 px-1 rounded font-mono">adb kill-server</code> 停止本机 ADB 服务</li>
                  <li>关闭 Android Studio、scrcpy 等占用设备的程序</li>
                  <li>拔插 USB 数据线后重新连接</li>
                </ol>
              </>
            ) : (
              <p className="mb-2">{error}</p>
            )}
            <button
              onClick={clearError}
              className="text-red-300 hover:text-red-200 underline"
            >
              关闭
            </button>
          </div>
        )}

        {/* Device Info */}
        {deviceInfo && connectionState === 'connected' && (
          <div className="bg-gray-800/40 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">型号</span>
              <span className="text-gray-300 font-mono">{deviceInfo.model}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">序列号</span>
              <span className="text-gray-300 font-mono text-[11px]">{deviceInfo.serial}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">产品</span>
              <span className="text-gray-300 font-mono">{deviceInfo.product}</span>
            </div>
          </div>
        )}

        {/* Connect/Disconnect Button */}
        {connectionState === 'connected' ? (
          <button
            onClick={disconnect}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
          >
            <Unplug className="w-3.5 h-3.5" />
            断开连接
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={
              !isSupported ||
              connectionState === 'connecting' ||
              connectionState === 'authenticating'
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {connectionState === 'connecting' || connectionState === 'authenticating' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Usb className="w-3.5 h-3.5" />
            )}
            {connectionState === 'connecting'
              ? '连接中...'
              : connectionState === 'authenticating'
              ? '请在手机上授权...'
              : '连接 Android 设备'}
          </button>
        )}

        {/* Help text */}
        {connectionState === 'disconnected' && (
          <p className="text-[10px] text-gray-600 leading-relaxed">
            确保手机已开启 USB 调试模式，通过 USB 数据线连接后点击上方按钮。
          </p>
        )}
      </div>
    </div>
  );
}
