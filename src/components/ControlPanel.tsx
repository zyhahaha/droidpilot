import { useState, useRef, useCallback } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { useAIStore } from '../store/aiStore';
import {
  Send,
  Square,
  Home,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Layers,
  Type,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export default function ControlPanel() {
  const { connectionState, pressHome, pressBack, pressRecent, swipe, typeText, captureScreen, setScreen, currentScreen } =
    useDeviceStore();
  const { config, status, runTask, stopAgent, addManualStep } = useAIStore();
  const [taskInput, setTaskInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isConnected = connectionState === 'connected';
  const isRunning = ['thinking', 'acting', 'observing'].includes(status);

  const handleRunTask = useCallback(async () => {
    if (!taskInput.trim() || !isConnected) return;
    try {
      await runTask(taskInput.trim(), (base64) => {
        setScreen(base64);
      });
    } catch {
      // Error handled in store
    }
  }, [taskInput, isConnected, runTask, setScreen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRunTask();
    }
  };

  const handleTypeText = async () => {
    if (!textInput.trim()) return;
    try {
      await typeText(textInput);
      addManualStep(`type_text("${textInput}")`, `已输入文本: "${textInput}"`);
      setTextInput('');
    } catch (err) {
      addManualStep(`type_text("${textInput}")`, `输入失败: ${err}`);
    }
  };

  const handleSwipe = async (direction: 'up' | 'down' | 'left' | 'right') => {
    // Get screen dimensions from the captured image
    let screenW = 1080;
    let screenH = 1920;
    
    if (currentScreen) {
      const img = new Image();
      img.src = `data:image/png;base64,${currentScreen}`;
      if (img.width > 0 && img.height > 0) {
        screenW = img.width;
        screenH = img.height;
      }
    }
    
    const cx = Math.floor(screenW / 2);
    const cy = Math.floor(screenH / 2);
    const dist = Math.floor(Math.min(screenW, screenH) * 0.3); // 30% of smaller dimension
    
    const map: Record<string, [number, number, number, number]> = {
      up: [cx, cy + dist, cx, cy - dist],
      down: [cx, cy - dist, cx, cy + dist],
      left: [cx + dist, cy, cx - dist, cy],
      right: [cx - dist, cy, cx + dist, cy],
    };
    const [x1, y1, x2, y2] = map[direction];
    const labelMap: Record<string, string> = { up: '上滑', down: '下滑', left: '左滑', right: '右滑' };
    try {
      await swipe(x1, y1, x2, y2, 300);
      addManualStep(`swipe_${direction}(${x1},${y1},${x2},${y2})`, `${labelMap[direction]}完成`);
    } catch (err) {
      addManualStep(`swipe_${direction}`, `${labelMap[direction]}失败: ${err}`);
    }
  };

  const handlePressBack = async () => {
    try {
      await pressBack();
      addManualStep('press_back', '按下返回键');
    } catch (err) {
      addManualStep('press_back', `返回键失败: ${err}`);
    }
  };

  const handlePressHome = async () => {
    try {
      await pressHome();
      addManualStep('press_home', '按下主页键');
    } catch (err) {
      addManualStep('press_home', `主页键失败: ${err}`);
    }
  };

  const handlePressRecent = async () => {
    try {
      await pressRecent();
      addManualStep('press_recent', '按下最近任务键');
    } catch (err) {
      addManualStep('press_recent', `最近任务键失败: ${err}`);
    }
  };

  const handleRefresh = async () => {
    try {
      await captureScreen();
      addManualStep('capture_screen', '刷新截图完成');
    } catch (err) {
      addManualStep('capture_screen', `截图失败: ${err}`);
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800/60 overflow-hidden">
      {/* AI Task Input */}
      <div className="p-4 border-b border-gray-800/60">
        <label className="text-[11px] font-mono text-gray-500 uppercase tracking-wider mb-2 block">
          AI 自动化任务
        </label>
        <div className="relative">
          <textarea
            ref={inputRef}
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !config.apiKey
                ? '请先在设置中配置 API Key...'
                : !isConnected
                ? '请先连接设备...'
                : '描述你要自动执行的任务...\n例如：打开微信，发一条消息给张三'
            }
            disabled={!isConnected || isRunning || !config.apiKey}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-xs text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-40 transition-all"
            rows={3}
          />
          <div className="absolute bottom-2 right-2 flex gap-1">
            {isRunning ? (
              <button
                onClick={stopAgent}
                className="p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="停止"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleRunTask}
                disabled={!taskInput.trim() || !isConnected || !config.apiKey}
                className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="执行任务"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between text-[11px] font-mono text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors"
        >
          <span>手动控制</span>
          {isCollapsed ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>

        {!isCollapsed && (
          <>
            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePressBack}
                disabled={!isConnected}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 text-xs hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                返回
              </button>
              <button
                onClick={handlePressHome}
                disabled={!isConnected}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 text-xs hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                主页
              </button>
              <button
                onClick={handlePressRecent}
                disabled={!isConnected}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 text-xs hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                最近
              </button>
            </div>

            {/* Swipe controls */}
            <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
              <div />
              <button
                onClick={() => handleSwipe('up')}
                disabled={!isConnected}
                className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800 disabled:opacity-30 transition-all flex items-center justify-center"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <div />
              <button
                onClick={() => handleSwipe('left')}
                disabled={!isConnected}
                className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800 disabled:opacity-30 transition-all flex items-center justify-center"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRefresh}
                disabled={!isConnected}
                className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800 disabled:opacity-30 transition-all flex items-center justify-center"
                title="刷新截图"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleSwipe('right')}
                disabled={!isConnected}
                className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800 disabled:opacity-30 transition-all flex items-center justify-center"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div />
              <button
                onClick={() => handleSwipe('down')}
                disabled={!isConnected}
                className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800 disabled:opacity-30 transition-all flex items-center justify-center"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <div />
            </div>

            {/* Text input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTypeText()}
                placeholder="输入文字..."
                disabled={!isConnected}
                className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/40 disabled:opacity-30 transition-all"
              />
              <button
                onClick={handleTypeText}
                disabled={!isConnected || !textInput.trim()}
                className="px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 transition-all"
              >
                <Type className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
