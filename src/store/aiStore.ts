// AI Agent State Management with Zustand
// Adapted for Electron IPC communication

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AgentConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
  maxIterations?: number;
}

interface AgentStep {
  thought: string;
  action: string;
  observation: string;
  timestamp: number;
}

type AgentStatus = 'idle' | 'thinking' | 'acting' | 'observing' | 'complete' | 'error' | 'stopped';

// We'll create the agent dynamically since it needs the device API
interface AndroidAgent {
  run: (task: string) => Promise<string>;
  stop: () => void;
  updateConfig: (config: Partial<AgentConfig>) => void;
}

// Dynamic agent creation function (will be implemented in lib/ai/agent.ts)
let createAgent: ((config: AgentConfig, callbacks: {
  onStatusChange: (status: AgentStatus) => void;
  onStepAdd: (step: AgentStep) => void;
  onScreenCapture: (base64: string) => void;
}) => AndroidAgent) | null = null;

// Agent factory setter (called when agent module loads)
export function setAgentFactory(factory: typeof createAgent) {
  createAgent = factory;
}

interface AIState {
  // Configuration (persisted)
  config: AgentConfig;

  // Runtime
  agent: AndroidAgent | null;
  status: AgentStatus;
  steps: AgentStep[];
  currentTask: string;
  result: string | null;
  error: string | null;

  // Task history
  taskHistory: Array<{ task: string; result: string; timestamp: number }>;

  // Actions
  updateConfig: (config: Partial<AgentConfig>) => void;
  runTask: (
    task: string,
    onScreenCapture?: (base64: string) => void
  ) => Promise<string>;
  stopAgent: () => void;
  clearSteps: () => void;
  clearError: () => void;
  addManualStep: (action: string, observation: string) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      config: {
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        temperature: 0.1,
        maxIterations: 15,
      },

      agent: null,
      status: 'idle',
      steps: [],
      currentTask: '',
      result: null,
      error: null,
      taskHistory: [],

      updateConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig },
        }));
        // Update existing agent if present
        const { agent } = get();
        if (agent) {
          agent.updateConfig(newConfig);
        }
      },

      runTask: async (task, onScreenCapture) => {
        const { config } = get();
        if (!config.apiKey) {
          throw new Error('请先配置 API Key');
        }

        // Ensure agent module is loaded
        if (!createAgent) {
          await import('../lib/ai/agent');
        }

        if (!createAgent) {
          throw new Error('Agent 未初始化，请刷新页面重试');
        }

        set({ currentTask: task, steps: [], result: null, error: null });

        const agent = createAgent(config, {
          onStatusChange: (status) => set({ status }),
          onStepAdd: (step) =>
            set((state) => ({ steps: [...state.steps, step] })),
          onScreenCapture,
        });

        set({ agent });

        try {
          const result = await agent.run(task);
          set((state) => ({
            result,
            taskHistory: [
              ...state.taskHistory,
              { task, result, timestamp: Date.now() },
            ].slice(-20), // Keep last 20 tasks
          }));
          return result;
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          set({ error: msg, status: 'error' });
          throw error;
        }
      },

      stopAgent: () => {
        const { agent } = get();
        if (agent) {
          agent.stop();
        }
        set({ status: 'stopped' });
      },

      clearSteps: () => set({ steps: [], result: null, error: null, status: 'idle' }),
      clearError: () => set({ error: null }),

      addManualStep: (action: string, observation: string) => {
        const step: AgentStep = {
          thought: '手动操作',
          action,
          observation,
          timestamp: Date.now(),
        };
        set((state) => ({ steps: [...state.steps, step] }));
      },
    }),
    {
      name: 'ai-agent-config',
      partialize: (state) => ({
        config: {
          ...state.config,
          apiKey: state.config.apiKey,
        },
      }),
    }
  )
);
