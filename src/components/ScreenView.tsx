import { useState, useRef, useCallback } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { Smartphone, ZoomIn, ZoomOut, RefreshCw, MousePointer } from 'lucide-react';

interface ScreenViewProps {
  onTap?: (x: number, y: number) => void;
}

export default function ScreenView({ onTap }: ScreenViewProps) {
  const { currentScreen, isCapturing, captureScreen, connectionState } = useDeviceStore();
  const [scale, setScale] = useState(0.5);
  const [tapMode, setTapMode] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!tapMode || !imgRef.current || !onTap) return;

      const rect = imgRef.current.getBoundingClientRect();
      const naturalWidth = imgRef.current.naturalWidth;
      const naturalHeight = imgRef.current.naturalHeight;
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      const x = Math.round(((e.clientX - rect.left) / displayWidth) * naturalWidth);
      const y = Math.round(((e.clientY - rect.top) / displayHeight) * naturalHeight);

      onTap(x, y);
    },
    [tapMode, onTap]
  );

  if (connectionState !== 'connected') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800/60">
        <div className="text-center space-y-4 px-6">
          <div className="w-20 h-20 rounded-2xl bg-gray-800/80 flex items-center justify-center mx-auto">
            <Smartphone className="w-10 h-10 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">连接设备后显示屏幕画面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900/50 rounded-xl border border-gray-800/60 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/60 bg-gray-900/80">
        <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">设备屏幕</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTapMode(!tapMode)}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              tapMode
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
            title="点击模式"
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale((s) => Math.min(s + 0.1, 1))}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.1, 0.2))}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => captureScreen()}
            disabled={isCapturing}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Screen Display */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-black/30">
        {currentScreen ? (
          <img
            ref={imgRef}
            src={`data:image/png;base64,${currentScreen}`}
            alt="设备屏幕"
            className={`rounded-lg shadow-2xl shadow-black/50 ${
              tapMode ? 'cursor-crosshair' : 'cursor-default'
            }`}
            style={{
              maxWidth: '100%',
              height: 'auto',
              transformOrigin: 'top center',
            }}
            onClick={handleImageClick}
          />
        ) : (
          <div className="text-gray-600 text-sm font-mono">截图加载中...</div>
        )}
      </div>
    </div>
  );
}
