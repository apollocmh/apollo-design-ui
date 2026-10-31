import type { CSSProperties, VNodeChild } from 'vue';

/** 目标容器：滚动监听与定位的参照物。默认 `window`。 */
export type AffixTarget = () => HTMLElement | Window | null | undefined;

/** 占位/固钉层的定位计算用的矩形快照。 */
export type { AffixRect } from './utils';

/**
 * 组件逻辑 Props。根节点的 `class` / `style` 是 Vue 原生 fallthrough attrs，
 * 由 Affix 透传至外层占位测量节点，不重复声明 `className` / `rootClassName` / `style`。
 */
export interface AffixProps {
  /** 距离窗口（或 `target`）顶部达到指定偏移后固钉。 */
  offsetTop?: number;
  /** 距离窗口（或 `target`）底部达到指定偏移后固钉。两者条件同时命中时 `offsetTop` 优先；顶部条件未命中时仍可固钉到底部。 */
  offsetBottom?: number;
  /**
   * 滚动监听与定位的参照目标。默认取 ConfigProvider 的 `getTargetContainer`，再退回 `window`。
   */
  target?: AffixTarget;
  /**
   * ⚠️ **`onChange` 不在这里**（规则 C19）：Vue 侧由 `emit('change', affixed)` 承担，
   *    模板上写 `@change`。antd 的 `onChange` prop 不移植成 prop。
   */
  /** 类名前缀。 */
  prefixCls?: string;
}

/** Public template-ref contract. */
export interface AffixRef {
  /** 手动触发一次「重新测量并应用定位」。 */
  updatePosition: () => void;
}

/**
 * ConfigProvider `components.affix` 配置对象的形状。
 * 此处的 `className` / `style` 是配置 schema，不是 `<Affix>` 组件 Props。
 */
export interface AffixConfig {
  className?: string;
  style?: CSSProperties;
}

/** 默认插槽。 */
export interface AffixSlot {
  default?: () => VNodeChild;
}
