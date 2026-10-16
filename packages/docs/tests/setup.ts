/**
 * 文档站测试全局 setup。
 *
 * 只做两件事，都是为了**确定性**：
 *   1. 抹掉测试之间的 localStorage / <html data-apollo-theme> 残留
 *      —— 主题与语言都是「模块级 ref + localStorage」实现，跨用例泄漏会让
 *         「切到暗色」这类断言在单独跑和整轮跑时给出不同答案。
 *   2. 给 jsdom 补 matchMedia（jsdom 不实现它，而系统主题/减弱动效都依赖它）。
 */
import { afterEach, beforeAll, vi } from 'vitest';

beforeAll(() => {
  // jsdom 不实现 scrollIntoView（搜索面板的键盘导航会调到它）。
  // 这是**环境缺口**不是产品缺陷 —— 真实浏览器都有，所以在测试侧补齐而不是改组件。
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }
});

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.apolloTheme;
  document.documentElement.lang = '';
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove());
});
