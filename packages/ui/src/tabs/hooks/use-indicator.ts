/**
 * 指示条（rc `hooks/useIndicator.js` 的等价物）。
 *
 * ── 纯函数部分（L1 的落点，R5）───────────────────────────────────────────────
 *
 * `getIndicatorStyle(offset, horizontal, rtl, indicator)`：
 *
 * | `align` | 定位 | `transform` |
 * |---|---|---|
 * | `'start'` | `left/right = offset[key]` | 无 |
 * | `'center'`（**默认**） | `left/right = offset[key] + width/2` | RTL `translateX(50%)`、LTR `translateX(-50%)` |
 * | `'end'` | `left/right = offset[key] + width` | `translateX(-100%)` |
 *
 * 纵向同构（`top` + `translateY`）。`size` 三形态：
 *   数字 ⇒ 定长；函数 ⇒ `size(origin)`；缺省 ⇒ `origin`（页签自身长度）。
 *
 * ⚠️ 横向的定位键随 RTL 变（`right` / `left`），但 **`align === 'end'` 的 transform 恒为
 *    `translateX(-100%)`**（不随 RTL 翻转）—— 上游如此。
 *
 * ── 🚨 所有数值必须过 `toCssSize`（PITFALLS 8 / D94，2026-09-30 实测踩到）──────────
 *
 * antd 侧是 React：`style={{ width: 33.45 }}` 会被 React **自动补成 `33.45px`**。
 * 本仓是 Vue：`patchStyle` 把数值**原样**写进 `el.style.width = '33.45'` ⇒ **非法值被浏览器丢弃**。
 * 于是指示条只剩 `transform`（唯一合法的字符串值），`width` / `left` 全丢 ——
 * 表现是「指示条恒 0 宽、贴在容器左上角」，**类型检查与单测都看不见**（jsdom 无布局），
 * 只有 L6 视觉能发现（本次正是 L6 的 0.03% 像素差把它揪出来的）。
 * ⇒ `width` / `height` / `left` / `top` **一律** `toCssSize(...)`。
 *
 * ── 为什么需要 rAF + 取整抑制 ────────────────────────────────────────────────
 *
 * 上游的注释（ant-design#53378）：指示条的 `left/width` 来自 DOM 测量，前后两次可能差
 * 0.3px 这种量级，直接写进 style 会让指示条**抖**。所以：
 *   1. 新值与原值**逐键取整相等**时**不更新**；
 *   2. 更新放进 `raf`（下一帧），并在依赖变化时取消上一帧。
 * 本仓照抄这两条 —— 去掉取整判据在 jsdom 下看不出来，但真机上肉眼可见。
 */

import { cancelRaf, raf } from '@apollo-design/utils';
import { type CSSProperties, onBeforeUnmount, type Ref, ref, watch } from 'vue';
import { toCssSize } from '../../_internal/to-css-size';
import type { TabsIndicator } from '../interface';
import type { TabOffset } from './use-offsets';

/** 指示条的内联样式（`undefined` ⇒ 还没测到，不渲染 style）。 */
export type IndicatorStyle = CSSProperties | undefined;

/** `size` 的三形态求值。 */
export const getIndicatorLength = (origin: number, size: TabsIndicator['size']): number => {
  if (typeof size === 'function') return size(origin);
  if (typeof size === 'number') return size;
  return origin;
};

/**
 * 数值 → 带单位的 CSS 串（**唯一的单位出口**）。
 *
 * ⚠️ 见文件头的说明：不经这里转一手的数值会被 Vue **静默丢弃**。
 */
const px = (value: number): string => toCssSize(value) as string;

/**
 * 指示条样式。**纯函数** —— `undefined` 表示「没有激活页签的偏移」。
 */
export function getIndicatorStyle(
  activeTabOffset: TabOffset | undefined,
  horizontal: boolean,
  rtl: boolean,
  indicator: TabsIndicator | undefined,
): IndicatorStyle {
  const { size, align = 'center' } = indicator ?? {};
  const style: Record<string, string | number> = {};

  if (!activeTabOffset) return undefined;

  if (horizontal) {
    style.width = px(getIndicatorLength(activeTabOffset.width, size));
    const key = rtl ? 'right' : 'left';
    if (align === 'start') {
      style[key] = px(activeTabOffset[key]);
    }
    if (align === 'center') {
      style[key] = px(activeTabOffset[key] + activeTabOffset.width / 2);
      style.transform = rtl ? 'translateX(50%)' : 'translateX(-50%)';
    }
    if (align === 'end') {
      style[key] = px(activeTabOffset[key] + activeTabOffset.width);
      style.transform = 'translateX(-100%)';
    }
  } else {
    style.height = px(getIndicatorLength(activeTabOffset.height, size));
    if (align === 'start') {
      style.top = px(activeTabOffset.top);
    }
    if (align === 'center') {
      style.top = px(activeTabOffset.top + activeTabOffset.height / 2);
      style.transform = 'translateY(-50%)';
    }
    if (align === 'end') {
      style.top = px(activeTabOffset.top + activeTabOffset.height);
      style.transform = 'translateY(-100%)';
    }
  }

  return style as CSSProperties;
}

/**
 * 逐键「取整相等」判据。
 *
 * ⚠️ 值可能是**带单位的串**（`toCssSize` 的产物，如 `'33.453125px'`），也可能是 `transform`
 *    这类非数值串 ⇒ 判据是：**两边都能解析出数值**时按取整比较，否则严格相等。
 *    （上游的样式值在 React 侧是数字，本仓是 px 串 —— 抖动抑制的语义必须一致。）
 */
export const isIndicatorStyleEqual = (prev: IndicatorStyle, next: IndicatorStyle): boolean => {
  if (!prev || !next) return prev === next;

  const numeric = (value: unknown): number | undefined => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return undefined;
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  return Object.keys(next).every((key) => {
    const newValue = (next as Record<string, unknown>)[key];
    const oldValue = (prev as Record<string, unknown>)[key];
    const newNum = numeric(newValue);
    const oldNum = numeric(oldValue);
    if (newNum !== undefined && oldNum !== undefined) {
      return Math.round(newNum) === Math.round(oldNum);
    }
    return newValue === oldValue;
  });
};

/**
 * 计算指示条样式，带 rAF 与抖动抑制。
 *
 * @param activeTabOffset 激活页签的偏移（响应式取值函数）
 * @param getTargets      其余输入（横向 / RTL / 指示条配置），响应式
 */
export function useIndicator(
  activeTabOffset: () => TabOffset | undefined,
  getTargets: () => { horizontal: boolean; rtl: boolean; indicator: TabsIndicator | undefined },
): { style: Ref<IndicatorStyle> } {
  const style = ref<IndicatorStyle>(undefined);
  let rafId: number | undefined;

  const clean = (): void => {
    // ⚠️ `rafId` 可能是 `undefined`（还没起过 rAF）—— `cancelRaf` 只收 `number`
    if (rafId !== undefined) {
      cancelRaf(rafId);
      rafId = undefined;
    }
  };

  watch(
    () => {
      const offset = activeTabOffset();
      const { horizontal, rtl, indicator } = getTargets();
      return [
        offset?.width,
        offset?.height,
        offset?.left,
        offset?.right,
        offset?.top,
        horizontal,
        rtl,
        indicator?.align,
        indicator?.size,
      ] as const;
    },
    () => {
      const offset = activeTabOffset();
      const { horizontal, rtl, indicator } = getTargets();
      const next = getIndicatorStyle(offset, horizontal, rtl, indicator);

      clean();
      rafId = raf(() => {
        // Avoid jitter caused by tiny numerical differences（取整相等就不更新）
        if (!isIndicatorStyleEqual(style.value, next)) {
          style.value = next;
        }
      });
    },
    { immediate: true },
  );

  onBeforeUnmount(clean);

  return { style };
}
