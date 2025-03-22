import eruda from 'eruda';

let isInitialized = false;
let isVisible = false;

/**
 * 初始化调试控制台
 */
export function initVConsole(): void {
  if (isInitialized) return;
  
  // 创建eruda实例但默认隐藏
  eruda.init({
    tool: ['console', 'elements', 'network', 'resources', 'info', 'sources'],
    useShadowDom: true,
    autoScale: true,
    defaults: {
      displaySize: 80,
      transparency: 0.9,
      theme: 'Dark'
    }
  });
  
  // 默认隐藏面板
  toggleVConsole(false);
  
  // 设置快捷键
  document.addEventListener('keydown', handleKeyDown);
  
  isInitialized = true;
  console.log('[调试控制台] 初始化完成，使用 Ctrl+Shift+D 显示/隐藏');
}

/**
 * 处理快捷键事件
 */
function handleKeyDown(event: KeyboardEvent): void {
  // 检测 Ctrl+Shift+D 组合键
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
    event.preventDefault();
    toggleVConsole();
  }
}

/**
 * 切换调试控制台显示状态
 */
export function toggleVConsole(forceState?: boolean): void {
  if (!eruda) return;
  
  if (forceState !== undefined) {
    isVisible = forceState;
  } else {
    isVisible = !isVisible;
  }
  
  if (isVisible) {
    eruda.show();
    console.log('[调试控制台] 已显示');
  } else {
    eruda.hide();
    console.log('[调试控制台] 已隐藏');
  }
}

/**
 * 销毁调试控制台实例
 */
export function destroyVConsole(): void {
  if (eruda) {
    document.removeEventListener('keydown', handleKeyDown);
    eruda.destroy();
    isInitialized = false;
    isVisible = false;
    console.log('[调试控制台] 已销毁');
  }
} 