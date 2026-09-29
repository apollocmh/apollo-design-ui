/**
 * Tabs 的纯函数工具层。
 *
 * 判据来源：rc-tabs@1.13.0 的 `es/util.js` 与 `TabNavList/index.js` 里的三个测量/夹取函数
 * （`getTabSize` / `getSize` / `getUnitValue` / `alignInRange`）。**行为逐条对齐，实现按 Vue 重写**
 * （H3：不逐行翻译 React 代码）。
 *
 * 为什么单独一个文件：这里是整组组件里**唯一能在 jsdom 下直接断言**的部分
 * （L1 的落点）。DOM 尺寸那部分在 jsdom 里恒为 0，只能靠 L6 视觉（`docs/analysis/tabs.md` R2）。
 */

import type { TabPosition, TabsItem } from './interface';

// ---------------------------------------------------------------------------
// key / removability
// ---------------------------------------------------------------------------

/**
 * `data-node-key` 里 `"` 的替身。
 *
 * ⚠️ 上游用 `TABS_DQ` 而不是转义序列：`data-node-key` 的值会拼进
 * `[data-node-key="…"]` 属性选择器，若 key 里含 `"` 会把选择器**截断**成语法错误。
 * 所以是「替换成一个不可能与真实 key 冲突的哨兵串」，不是「转义」。
 */
export const TABS_DQ = 'TABS_DQ';

/** `data-node-key` 的值（rc `genDataNodeKey`）。 */
export const genDataNodeKey = (key: string | number): string => String(key).replace(/"/g, TABS_DQ);

/**
 * 该页签是否可删除（rc `getRemovable`，**四条件**）。
 *
 * 逐条：
 *   1. 不是 editable（`type !== 'editable-card'`）⇒ 永不可删；
 *   2. `disabled` ⇒ 不可删；
 *   3. `closable === false` ⇒ 不可删；
 *   4. `closable === undefined` 且 `closeIcon` 是 `false` / `null` ⇒ 不可删。
 *
 * ⚠️ 第 4 条只看 **`undefined`**：`closable === true` 时即使用户把 `closeIcon` 设成
 *    `false`/`null` 也仍然可删（此时按钮内容回退成 `editable.removeIcon || '×'`）。
 */
export const getRemovable = (
  closable: boolean | undefined,
  closeIcon: unknown,
  editable: { removeIcon?: unknown } | undefined,
  disabled: boolean | undefined,
): boolean => {
  if (
    // Only editable tabs can be removed
    !editable ||
    // Tabs cannot be removed when disabled
    disabled ||
    // closable is false
    closable === false ||
    // If closable is undefined, the remove button should be hidden when closeIcon is null or false
    (closable === undefined && (closeIcon === false || closeIcon === null))
  ) {
    return false;
  }
  return true;
};

// ---------------------------------------------------------------------------
// 测量
// ---------------------------------------------------------------------------

/** `[width, height, left, top]`（相对 tabList 容器）。 */
export type TabSizeTuple = [number, number, number, number];

/**
 * 单个页签的尺寸（rc `getTabSize`）。
 *
 * ⚠️ **优先 `getBoundingClientRect`，与 `offsetWidth` 相差 < 1 才采信** ——
 *    这是上游为规避小数累计误差加的容差（`offsetWidth` 是取整值）。
 *    超过容差说明两者来自不同的布局口径，此时退回 `offset*`。
 */
export const getTabSize = (node: Element, containerRect: DOMRect): TabSizeTuple => {
  const el = node as HTMLElement;
  const { offsetWidth, offsetHeight, offsetTop, offsetLeft } = el;
  const { width, height, left, top } = el.getBoundingClientRect();

  // Use getBoundingClientRect to avoid decimal inaccuracy
  if (Math.abs(width - offsetWidth) < 1) {
    return [width, height, left - containerRect.left, top - containerRect.top];
  }
  return [offsetWidth, offsetHeight, offsetLeft, offsetTop];
};

/** 元素的 `[width, height]`（rc `getSize`，同一个 <1 容差判据）。 */
export const getSize = (element: HTMLElement | null | undefined): [number, number] => {
  if (!element) return [0, 0];
  const { offsetWidth = 0, offsetHeight = 0 } = element;
  // Use getBoundingClientRect to avoid decimal inaccuracy
  const { width, height } = element.getBoundingClientRect();
  if (Math.abs(width - offsetWidth) < 1) {
    return [width, height];
  }
  return [offsetWidth, offsetHeight];
};

/**
 * 横向布局取 `[0]`、纵向取 `[1]`（rc `getUnitValue`）。
 *
 * ⚠️ 参数是 `tabPositionTopOrBottom`，**不是** `tabPosition`（语义相反，写错会静默取错维度）。
 */
export const getUnitValue = ([w, h]: readonly [number, number], topOrBottom: boolean): number =>
  topOrBottom ? w : h;

/** 把位移夹到 `[min, max]`（rc `alignInRange`）。**纯函数，L1 直接可测。** */
export const alignInRange = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

/**
 * 位移的三个区间（rc `TabNavList` 里的 `transformMin` / `transformMax`）。
 *
 * ⚠️ **三个分支不对称**：RTL 的符号方向与另两者相反（`0 … +` vs `- … 0`）。
 *    这是最容易写错的一处 —— 横向 LTR 与纵向共用「≤ 0」，只有横向 RTL 是「≥ 0」。
 */
export const getTransformRange = (
  topOrBottom: boolean,
  rtl: boolean,
  visibleTabContentValue: number,
  tabContentSizeValue: number,
): [number, number] => {
  if (!topOrBottom) {
    return [Math.min(0, visibleTabContentValue - tabContentSizeValue), 0];
  }
  if (rtl) {
    return [0, Math.max(0, tabContentSizeValue - visibleTabContentValue)];
  }
  return [Math.min(0, visibleTabContentValue - tabContentSizeValue), 0];
};

// ---------------------------------------------------------------------------
// 杂项
// ---------------------------------------------------------------------------

/** 是否是移动端（rc 用 `@rc-component/util` 的 `isMobile`）。SSR 恒 false。 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined' || !window.navigator) return false;
  return /(android|iphone|ipad|ipod|harmonyos)/i.test(window.navigator.userAgent ?? '');
};

/**
 * 过滤出合法的 items（rc：`(items || []).filter(item => item && typeof item === 'object' && 'key' in item)`）。
 *
 * ⚠️ 条件里**必须有 `'key' in item`**：`items` 里混进 `null` / 字符串时会被丢掉，
 * 而不是渲染成一个 key 为 `undefined` 的页签。
 */
export const filterItems = (items: TabsItem[] | undefined): TabsItem[] =>
  (items ?? []).filter(
    (item): item is TabsItem => !!item && typeof item === 'object' && 'key' in item,
  );

/** `tabs` 的 key 串（rc 用它当 `useEffect` 依赖，因为数组每轮都是新引用）。 */
export const stringifyKeys = (tabs: readonly TabsItem[]): string =>
  tabs.map((tab) => tab.key).join('_');

/** `Map` / 对象 → JSON 串（rc `stringify`，用于把 Map 变成稳定的依赖值）。 */
export const stringify = (value: unknown): string => {
  if (value instanceof Map) {
    const target: Record<string, unknown> = {};
    for (const [k, v] of value) target[String(k)] = v;
    return JSON.stringify(target);
  }
  return JSON.stringify(value);
};

/** 定位到 `tabPosition` 的方位（`'top' | 'bottom'` ⇒ 横向）。 */
export const isTopOrBottom = (tabPosition: TabPosition): boolean =>
  tabPosition === 'top' || tabPosition === 'bottom';
