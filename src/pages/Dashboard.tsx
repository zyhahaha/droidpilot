import { useState } from 'react';
import ScreenView from '../components/ScreenView';
import DevicePanel from '../components/DevicePanel';
import ControlPanel from '../components/ControlPanel';
import ActionLog from '../components/ActionLog';
import SettingsModal from '../components/SettingsModal';
import { useDeviceStore } from '../store/deviceStore';
import { useAIStore } from '../store/aiStore';
import {
  Settings,
  Cpu,
  Terminal,
  Sparkles,
} from 'lucide-react';

export default function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { connectionState, tap } = useDeviceStore();
  const { config } = useAIStore();

  const isConnected = connectionState === 'connected';

  return (
    <div className="h-screen flex flex-col bg-[#0a0b0f] text-white overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-800/60 bg-gray-900/30 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-sm font-bold tracking-tight">
                <span className="text-gray-200">Droid</span>
                <span className="text-emerald-400">Pilot</span>
              </h1>
            </div>
            <div className="h-4 w-px bg-gray-800" />
            <span className="text-[10px] text-gray-600 font-mono">
              Electron + Native USB ADB
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* API status indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono ${
                config.apiKey
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-gray-800/50 text-gray-500 border border-gray-700/50'
              }`}
            >
              <Cpu className="w-2.5 h-2.5" />
              {config.apiKey ? config.model : '未配置 AI'}
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/80 transition-colors"
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex min-h-0 p-3 gap-3">
        {/* Left: Device Screen */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScreenView onTap={isConnected ? tap : undefined} />
        </div>

        {/* Right: Controls & Log */}
        <div className="w-80 shrink-0 flex flex-col gap-3 min-h-0">
          <DevicePanel />
          <ControlPanel />
          <ActionLog />
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-gray-800/40 bg-gray-900/20 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-gray-600">
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              AI 驱动的 Android 自动化
            </span>
            <span>•</span>
            <span>Electron 桌面应用 + 原生 USB 通信</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
