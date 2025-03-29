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
  
  // 隐藏顶部工具栏/标签栏和入口按钮
  const style = document.createElement('style');
  style.textContent = `
    /* 隐藏导航栏和标签 */
    .eruda-dev-tools .eruda-nav-bar, 
    .eruda-dev-tools .eruda-nav-bar-container,
    .eruda-dev-tools .eruda-tab {
      display: none !important;
    }
    .eruda-dev-tools .eruda-tools {
      border-top: none !important;
      height: 100% !important;
    }
    /* 完全隐藏入口按钮 */
    #eruda, .eruda-entry-btn {
      opacity: 0 !important;
      visibility: hidden !important;
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
  
  // 尝试直接移除入口按钮元素
  setTimeout(() => {
    try {
      const entryBtn = document.querySelector('.eruda-entry-btn') || document.querySelector('#eruda');
      if (entryBtn && entryBtn.parentNode) {
        entryBtn.parentNode.removeChild(entryBtn);
      }
    } catch (e) {
      // 忽略错误
    }
  }, 500);
  
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