// LangChain.js 自定义工具用于ADB设备控制（Electron版本）
// 使用IPC与主进程通信以执行ADB操作

import { Tool } from '@langchain/core/tools';

/**
 * 工具：从安卓设备截取屏幕
 */
export class ScreenCaptureTool extends Tool {
  name = 'capture_screenshot';
  description =
    '截取安卓设备屏幕的截图。返回base64编码的PNG图像。使用此工具查看设备当前显示的内容。';
  
  private onCapture?: (base64: string) => void;

  constructor(onCapture?: (base64: string) => void) {
    super();
    this.onCapture = onCapture;
  }

  async _call(): Promise<string> {
    try {
      const capture = await window.electronAPI.captureScreen();
      this.onCapture?.(capture.base64);
      return `截屏成功 (${capture.width}x${capture.height})。图像已发送分析。`;
    } catch (error) {
      return `截屏失败: ${error}`;
    }
  }
}

/**
 * 工具：点击屏幕位置
 */
export class TapTool extends Tool {
  name = 'tap_screen';
  description =
    '在安卓设备屏幕的指定(x, y)坐标位置点击。输入格式为"x,y"，例如"540,960"。';

  async _call(input: string): Promise<string> {
    try {
      const [x, y] = input.split(',').map(Number);
      if (isNaN(x) || isNaN(y)) {
        return '输入格式无效。请使用"x,y"格式，例如"540,960"';
      }
      await window.electronAPI.tap(x, y);
      return `成功点击位置 (${x}, ${y})`;
    } catch (error) {
      return `点击失败: ${error}`;
    }
  }
}

/**
 * 工具：滑动手势
 */
export class SwipeTool extends Tool {
  name = 'swipe_screen';
  description =
    '在安卓设备上执行滑动手势。输入格式为"x1,y1,x2,y2,duration"。持续时间可选（默认300毫秒）。例如，"540,1500,540,500,500"表示向上滑动。';

  async _call(input: string): Promise<string> {
    try {
      const parts = input.split(',').map(Number);
      const [x1, y1, x2, y2] = parts;
      const duration = parts[4] ?? 300;
      if ([x1, y1, x2, y2].some(isNaN)) {
        return '输入格式无效。请使用"x1,y1,x2,y2[,duration]"格式';
      }
      await window.electronAPI.swipe(x1, y1, x2, y2, duration);
      return `成功从 (${x1}, ${y1}) 滑动到 (${x2}, ${y2})，耗时${duration}毫秒`;
    } catch (error) {
      return `滑动失败: ${error}`;
    }
  }
}

/**
 * 工具：输入文本
 */
export class TypeTextTool extends Tool {
  name = 'type_text';
  description =
    '在安卓设备上输入文本（支持中文和英文字符）。输入为要输入的文本字符串。注意：输入前请确保已点击输入框使其获得焦点。';

  async _call(input: string): Promise<string> {
    try {
      await window.electronAPI.typeText(input);
      return `成功输入: "${input}"`;
    } catch (error) {
      return `输入文本失败: ${error}`;
    }
  }
}

/**
 * 工具：按下导航按钮
 */
export class NavigationTool extends Tool {
  name = 'press_button';
  description =
    '在安卓设备上按下导航按钮。输入应为以下之一："home"、"back"、"recent"、"enter"、"delete"、"power"、"volume_up"、"volume_down"。';

  async _call(input: string): Promise<string> {
    try {
      const keyMap: Record<string, number> = {
        home: 3,
        back: 4,
        power: 26,
        volume_up: 24,
        volume_down: 25,
        enter: 66,
        delete: 67,
        recent: 187,
        menu: 82,
        tab: 61,
      };
      const keycode = keyMap[input.toLowerCase().trim()];
      if (keycode === undefined) {
        return `未知按钮: "${input}"。可用按钮: ${Object.keys(keyMap).join(', ')}`;
      }
      await window.electronAPI.keyEvent(keycode);
      return `成功按下 ${input}`;
    } catch (error) {
      return `按键失败: ${error}`;
    }
  }
}

/**
 * 工具：执行shell命令
 */
export class ShellCommandTool extends Tool {
  name = 'shell_command';
  description =
    '通过ADB在安卓设备上执行shell命令。用于检查已安装的应用包、设备信息等高级操作。输入为shell命令字符串。';

  async _call(input: string): Promise<string> {
    try {
      const output = await window.electronAPI.shell(input);
      return output.trim() || '(无输出)';
    } catch (error) {
      return `Shell命令执行失败: ${error}`;
    }
  }
}

/**
 * 工具：长按
 */
export class LongPressTool extends Tool {
  name = 'long_press';
  description =
    '在指定的(x, y)坐标位置执行长按操作。输入格式为"x,y[,duration]"。持续时间可选（默认1000毫秒）。';

  async _call(input: string): Promise<string> {
    try {
      const parts = input.split(',').map(Number);
      const [x, y] = parts;
      const duration = parts[2] ?? 1000;
      if (isNaN(x) || isNaN(y)) {
        return '输入格式无效。请使用"x,y[,duration]"格式';
      }
      await window.electronAPI.longPress(x, y, duration);
      return `成功在 (${x}, ${y}) 长按 ${duration}毫秒`;
    } catch (error) {
      return `长按失败: ${error}`;
    }
  }
}

/**
 * 工具：等待/延迟
 */
export class WaitTool extends Tool {
  name = 'wait';
  description =
    '等待指定的毫秒数。用于操作之间让设备UI更新。输入为持续时间（毫秒），例如"1000"表示1秒。';

  async _call(input: string): Promise<string> {
    const ms = parseInt(input) || 1000;
    await new Promise((resolve) => setTimeout(resolve, ms));
    return `已等待 ${ms}毫秒`;
  }
}

/** 创建所有ADB工具 */
export function createAdbTools(onCapture?: (base64: string) => void) {
  return [
    new ScreenCaptureTool(onCapture),
    new TapTool(),
    new SwipeTool(),
    new TypeTextTool(),
    new NavigationTool(),
    new ShellCommandTool(),
    new LongPressTool(),
    new WaitTool(),
  ];
}
