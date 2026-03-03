import { useState } from 'react';
import { useAIStore } from '../store/aiStore';
import {
  Settings,
  X,
  Key,
  Globe,
  Cpu,
  Thermometer,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { config, updateConfig } = useAIStore();
  const [showKey, setShowKey] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    updateConfig(localConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults = {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      temperature: 0.1,
      maxIterations: 15,
    };
    setLocalConfig(defaults);
    updateConfig(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-200">AI 模型设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* API Key */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
              <Key className="w-3 h-3" />
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localConfig.apiKey}
                onChange={(e) =>
                  setLocalConfig((c) => ({ ...c, apiKey: e.target.value }))
                }
                placeholder="sk-..."
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 pr-10 font-mono transition-all"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-1">
              支持 OpenAI 及兼容 API（如 DeepSeek、Together 等）
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
              <Globe className="w-3 h-3" />
              API 端点
            </label>
            <input
              type="text"
              value={localConfig.baseUrl}
              onChange={(e) =>
                setLocalConfig((c) => ({ ...c, baseUrl: e.target.value }))
              }
              placeholder="https://api.openai.com/v1"
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 font-mono transition-all"
            />
          </div>

          {/* Model */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
              <Cpu className="w-3 h-3" />
              模型名称
            </label>
            <input
              type="text"
              value={localConfig.model}
              onChange={(e) =>
                setLocalConfig((c) => ({ ...c, model: e.target.value }))
              }
              placeholder="gpt-4o"
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 font-mono transition-all"
            />
            <p className="text-[10px] text-gray-600 mt-1">
              推荐使用支持视觉的模型：gpt-4o / gpt-4o-mini / claude-3.5-sonnet 等
            </p>
          </div>

          {/* Temperature */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
                <Thermometer className="w-3 h-3" />
                温度 ({localConfig.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localConfig.temperature}
                onChange={(e) =>
                  setLocalConfig((c) => ({
                    ...c,
                    temperature: parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
                <RotateCcw className="w-3 h-3" />
                最大迭代
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={localConfig.maxIterations}
                onChange={(e) =>
                  setLocalConfig((c) => ({
                    ...c,
                    maxIterations: parseInt(e.target.value) || 15,
                  }))
                }
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 font-mono transition-all"
              />
            </div>
          </div>

          {/* Security notice */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
            <p className="text-[10px] text-amber-400/70 leading-relaxed">
              ⚠️ API Key 将存储在本地。请仅在信任的设备上使用，切勿在公共电脑上保存密钥。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/60">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
          >
            恢复默认
          </button>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-emerald-400 text-xs">
                <CheckCircle2 className="w-3 h-3" />
                已保存
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-800 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
