/**
 * Affix 的类型面。
 *
 * ⚠️ 脚手架**没有**预生成 affix 的导出清单（`packages/ui/src/index.ts` 里搜不到
 *    `Affix`）⇒ 本文件就是类型面的**源头**，`index.ts` 只做转出口。
 *    因此这里的导出名要自己保证与 antd 对齐（`interface.d.ts` 比对）。
 */

import type { CSSProperties, VNodeChild } from 'vue';

/** 目标容器：滚动监听与定位的参照物。默认 `window`。 */
export type AffixTarget = () => HTMLElement | Window | null;

/** 占位/固钉层的定位计算用的矩形快照。 */
export type { AffixRect } from './utils';

export interface AffixProps {
  /** 距离窗口（或 `target`）顶部达到指定偏移后固钉。 */
  offsetTop?: number;
  /** 距离窗口（或 `target`）底部达到指定偏移后固钉。**与 `offsetTop` 互斥**：都传时只有 `offsetTop` 生效。 */
  offsetBottom?: number;
  /** 滚动监听与定位的参照目标。默认取 ConfigProvider 的 `getTargetContainer`，再退回 `window`。 */
  target?: AffixTarget;
  /** 固钉状态变化回调。**只在状态翻转时触发**，连续固钉不会重复发。 */
  onChange?: (affixed: boolean) => void;
  /** 类名前缀。 */
  prefixCls?: string;
  /** 根元素（占位测量层）类名。 */
  className?: string;
  /** 根元素类名（优先级最高）。 */
  rootClassName?: string;
  /** 根元素（占位测量层）样式。 */
  style?: CSSProperties;
  /**
   * ⚠️ **`children` 不在 Props 里**（Vue 侧是默认插槽，规则 C19）。
   *    本文件不声明它，`defineSlots` 负责。
   */
}

/** `ref` 暴露面 —— 与 antd 一致，只有 `updatePosition`。 */
export interface AffixRef {
  /** 手动触发一次「重新测量并应用定位」。 */
  updatePosition: () => void;
}

/** ConfigProvider 里 `components.affix` 的形状。 */
export interface AffixConfig {
  className?: string;
  style?: CSSProperties;
}

/** 默认插槽。 */
export interface AffixSlot {
  default?: () => VNodeChild;
}
