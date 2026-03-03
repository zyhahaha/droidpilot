import { useRef, useEffect } from 'react';
import { useAIStore } from '../store/aiStore';
import {
  Brain,
  Zap,
  Eye,
  CheckCircle2,
  XCircle,
  StopCircle,
  Clock,
  Trash2,
  Hand,
} from 'lucide-react';

const statusIcons: Record<string, React.ReactNode> = {
  thinking: <Brain className="w-3.5 h-3.5 text-violet-400 animate-pulse" />,
  acting: <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />,
  observing: <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />,
  complete: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  error: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  stopped: <StopCircle className="w-3.5 h-3.5 text-orange-400" />,
  idle: <Clock className="w-3.5 h-3.5 text-gray-500" />,
};

const statusLabels: Record<string, string> = {
  thinking: '思考中...',
  acting: '执行操作...',
  observing: '分析屏幕...',
  complete: '任务完成',
  error: '执行出错',
  stopped: '已停止',
  idle: '就绪',
};

export default function ActionLog() {
  const { steps, status, result, error, clearSteps } = useAIStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps, result, error]);

  return (
    <div className="flex-1 flex flex-col bg-gray-900/50 rounded-xl border border-gray-800/60 overflow-hidden min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            执行日志
          </span>
          {steps.length > 0 && (
            <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">
              {steps.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {statusIcons[status]}
            <span className="text-[11px]">{statusLabels[status]}</span>
          </div>
          {steps.length > 0 && (
            <button
              onClick={clearSteps}
              className="p-1 rounded text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors"
              title="清空日志"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 scroll-smooth"
      >
        {steps.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-xs font-mono">等待任务执行...</p>
          </div>
        )}

        {steps.map((step, i) => {
          const isManual = step.thought === '手动操作';
          return (
            <div
              key={i}
              className={`rounded-lg p-2.5 space-y-1 border text-xs ${
                isManual
                  ? 'bg-blue-500/5 border-blue-500/20'
                  : 'bg-gray-800/30 border-gray-800/40'
              }`}
            >
              {isManual ? (
                <>
                  <div className="flex items-start gap-2">
                    <Hand className="w-3 h-3 text-blue-400/70 mt-0.5 shrink-0" />
                    <p className="text-blue-300/80 font-mono text-[11px]">{step.action}</p>
                  </div>
                  {step.observation && (
                    <div className="flex items-start gap-2">
                      <Eye className="w-3 h-3 text-cyan-400/70 mt-0.5 shrink-0" />
                      <p className="text-gray-500 leading-relaxed text-[11px]">{step.observation}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {step.thought && (
                    <div className="flex items-start gap-2">
                      <Brain className="w-3 h-3 text-violet-400/70 mt-0.5 shrink-0" />
                      <p className="text-gray-400 leading-relaxed">{step.thought}</p>
                    </div>
                  )}
                  {step.action && step.action !== 'initialize' && (
                    <div className="flex items-start gap-2">
                      <Zap className="w-3 h-3 text-amber-400/70 mt-0.5 shrink-0" />
                      <p className="text-amber-300/80 font-mono text-[11px]">{step.action}</p>
                    </div>
                  )}
                  {step.observation && (
                    <div className="flex items-start gap-2">
                      <Eye className="w-3 h-3 text-cyan-400/70 mt-0.5 shrink-0" />
                      <p className="text-gray-500 leading-relaxed text-[11px] break-all">
                        {step.observation.length > 200
                          ? step.observation.slice(0, 200) + '...'
                          : step.observation}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Result */}
        {result && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              任务完成
            </div>
            <p className="text-emerald-300/80 text-xs leading-relaxed">{result}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400 text-xs font-medium mb-1">
              <XCircle className="w-3.5 h-3.5" />
              执行出错
            </div>
            <p className="text-red-300/80 text-xs font-mono">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
