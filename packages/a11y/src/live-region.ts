/**
 * live region —— 给读屏软件播报「页面某处变了」。
 *
 * 契约来源（上游有**三处**实现，形状不一致，见下方注释）：
 *   - `@rc-component/select@1.10.1/es/BaseSelect/Polite.js` —— 文本截断与拼接
 *   - `components/image/Progress.tsx:7-17,125` —— 视觉隐藏样式 + `role="status"`
 *   - `components/spin/index.tsx:264` —— 直接挂在容器上（本包不采用，见 §4）
 *
 * ⚠️ 本包**零 CSS**：唯一的样式是隐藏 live region 的内联样式 ——
 * 它不是装饰，而是「元素必须存在于无障碍树里、但不占视觉空间」这一语义的一部分。
 */

import { canUseDom } from '@apollo-design/utils';
import { onMounted, onScopeDispose } from 'vue';

/**
 * 播报文本最多的条目数。
 *
 * `Polite.js`：`const MAX_COUNT = 50;` —— 注释写得很直白：
 * "Only cut part of values since it's a screen reader"（读屏而已，不用播全）。
 */
export const LIVE_REGION_MAX_COUNT = 50;

/**
 * 视觉隐藏样式。
 *
 * 逐条来自 `components/image/Progress.tsx:7-17`：
 * ```js
 * { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
 *   overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }
 * ```
 * （React 会把数字补成 px，这里直接写字符串，因为是往 `element.style` 上赋。）
 *
 * ⚠️ **另一套上游样式是 `Polite.js` 的 `{width:0, height:0, position:'absolute',
 * overflow:'hidden', opacity:0}`** —— 两套不一样，我们选这一套，理由见契约文档 §6 第 2 条：
 * `opacity:0` 在部分读屏实现下会被判为「真正不可见」而整块跳过。
 */
export const VISUALLY_HIDDEN_STYLE: Readonly<Record<string, string>> = Object.freeze({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
});

export interface LiveRegionValue {
  /** 显示文本；只有 number / string 会被播报，否则退回 `value` */
  label?: unknown;
  value?: string | number;
}

/**
 * 单条目取哪个文本。
 *
 * `Polite.js`：`['number','string'].includes(typeof label) ? label : value`
 *
 * ⚠️ 上游在两者都不是原始值时会把 `value` **原样交给 React**（对象会抛错）。
 *    我们把入参的 `value` 类型约束成 `string | number`，于是行为对一切合法输入都一致。
 */
function pickLabel(item: LiveRegionValue): string | number | undefined {
  const { label, value } = item;
  if (typeof label === 'number' || typeof label === 'string') {
    return label;
  }
  return value;
}

/**
 * 拼播报文本。
 *
 * `Polite.js`：
 * ```js
 * `${values.slice(0, MAX_COUNT).map(({label, value}) =>
 *     ['number','string'].includes(typeof label) ? label : value).join(', ')}`
 * // 后面再拼：values.length > MAX_COUNT ? ', ...' : null
 * ```
 *
 * 注意两处细节：
 *   - 分隔符是**半角逗号加空格** `', '`
 *   - 超长时追加的是 `', ...'`（半角逗号）
 *   - `join` 会把 `undefined` 变成空串 —— 这正是上游的行为，不要「过滤掉空项」
 */
export function formatLiveRegionText(
  values: readonly LiveRegionValue[],
  maxCount: number = LIVE_REGION_MAX_COUNT,
): string {
  const shown = values.slice(0, maxCount).map(pickLabel).join(', ');
  return values.length > maxCount ? `${shown}, ...` : shown;
}

// ===========================================================================
// DOM 侧
// ===========================================================================

export interface LiveRegionOptions {
  /** 默认取全局 `document` */
  doc?: Document;
  /** 默认 `'status'`（隐含 `aria-live="polite"`，与 `Progress.tsx:125` 一致） */
  role?: string;
  /**
   * 默认 `'polite'`。
   *
   * ⚠️ `'assertive'` 会**打断**读屏当前正在读的内容。上游只用 `polite`
   * （见契约文档 §8 P2），所以这里也不提供默认值之外的快捷方式。
   */
  live?: 'polite' | 'assertive';
  className?: string;
}

export interface LiveRegionHandle {
  element: HTMLElement;
  setText(text: string): void;
  destroy(): void;
}

/**
 * 建一个隐藏的 live region 并挂到 `document.body`。
 *
 * `Polite.js` 是**渲染在组件里**的，而 `Progress.tsx` 也是内联渲染 ——
 * 两者都依赖 React 的渲染树。本包不产出组件（边界见契约文档 §4），
 * 所以这里直接操作 DOM：调用方只需要一个「往里塞文本」的口子。
 *
 * @throws 没有 DOM 时抛错 —— live region 必须是真实节点才可能被读屏发现，
 *         静默返回空壳会让「播报没生效」变成无法察觉的问题。
 *         组件内请用 `useLiveRegion`（它在挂载后才建）。
 */
export function createLiveRegion(options: LiveRegionOptions = {}): LiveRegionHandle {
  const doc = options.doc ?? (canUseDom() ? document : null);
  if (!doc) {
    throw new Error('[a11y] createLiveRegion 需要 DOM：请在挂载后调用，或显式传入 doc。');
  }

  const element = doc.createElement('span');
  element.setAttribute('role', options.role ?? 'status');
  element.setAttribute('aria-live', options.live ?? 'polite');
  if (options.className) {
    element.className = options.className;
  }
  // ⚠️ 用**属性赋值**而不是 `setProperty`：键是 camelCase，而 `setProperty`
  //    只认连字符写法 —— `setProperty('whiteSpace', ...)` 在 jsdom 里会被静默丢弃。
  Object.assign(element.style, VISUALLY_HIDDEN_STYLE);
  doc.body.appendChild(element);

  return {
    element,
    setText(text: string): void {
      element.textContent = text;
    },
    destroy(): void {
      element.remove();
    },
  };
}

export interface UseLiveRegionReturn {
  /** 直接播报一段文本 */
  announce(text: string): void;
  /** 播报一组值（走 `formatLiveRegionText` 的截断规则） */
  announceValues(values: readonly LiveRegionValue[], maxCount?: number): void;
}

// ===========================================================================
// 模块级单例
// ===========================================================================

/**
 * 共享的 live region 节点。
 *
 * ⚠️ **必须复用同一个节点**（`packages/a11y/README.md` 的契约第二条）。
 *    每次播报都新建一个 span 的话，读屏会把它当成一个新元素，
 *    前一条还没播完就被下一条打断 —— 表现是「播报丢失」。
 *    复用同一个节点、只改 `textContent`，读屏会把它当作同一处的变化。
 */
let sharedRegion: LiveRegionHandle | null = null;

/**
 * 播报一段文本（模块级单例，不需要组件上下文）。
 *
 * 适用于「没有宿主组件」的场景：`message` / `notification` 的命令式 API
 * 就是这样被调用的 —— 它们没有可用的 setup 作用域。
 *
 * ⚠️ 节点建好后**不会自动销毁** —— 它是进程级的。测试里用
 *    `resetAnnounceRegion()` 清掉，否则会跨用例串台。
 *
 * @throws 没有 DOM 时抛错（同 `createLiveRegion`）
 */
export function announce(text: string): void {
  if (!sharedRegion) {
    sharedRegion = createLiveRegion();
  }
  sharedRegion.setText(text);
}

/** 播报一组值（走 `formatLiveRegionText` 的截断规则）。 */
export function announceValues(values: readonly LiveRegionValue[], maxCount?: number): void {
  announce(formatLiveRegionText(values, maxCount));
}

/** 测试辅助：销毁共享节点。生产代码不应调用。 */
export function resetAnnounceRegion(): void {
  sharedRegion?.destroy();
  sharedRegion = null;
}

/**
 * Vue 包装：挂载时建、卸载时销毁。
 *
 * ⚠️ 必须在 `onMounted` 里建而不是 setup 里 —— SSR 下没有 `document`，
 * 而且 `onScopeDispose` 与 `onMounted` 配对才能保证「建了就一定会被销毁」。
 */
export function useLiveRegion(options: LiveRegionOptions = {}): UseLiveRegionReturn {
  let region: LiveRegionHandle | null = null;

  onMounted(() => {
    region = createLiveRegion(options);
  });

  onScopeDispose(() => {
    region?.destroy();
    region = null;
  });

  return {
    announce(text: string): void {
      region?.setText(text);
    },
    announceValues(values: readonly LiveRegionValue[], maxCount?: number): void {
      region?.setText(formatLiveRegionText(values, maxCount));
    },
  };
}
