/**
 * Tabs 的动画配置归一（antd `hooks/useAnimateConfig.js` 的等价物）。
 *
 * ── 判据（逐字对齐 antd 6.6.4）──────────────────────────────────────────────────
 *
 * ```
 * animated === false        → { inkBar: false, tabPane: false }
 * animated === true         → { inkBar: true,  tabPane: true  }
 * 其它（undefined / 对象）  → { inkBar: true, ...(isPlainObject(animated) ? animated : {}) }
 *
 * tabPane 为真时补 tabPaneMotion = { motionAppear: false, motionEnter: true,
 *                                    motionLeave: true, motionName: `${prefixCls}-switch` }
 * ```
 *
 * ⚠️ **默认值是 `{ inkBar: true, tabPane: false }`** —— 即「指示条有过渡、面板没有」。
 *    注意 `animated === undefined` 与 `animated === true` 结果**不同**（前者面板无动画）。
 *
 * ⚠️ `motionName` 的前缀是**传入的 `prefixCls`（= `apollo-tabs`）**，不是 `rootPrefixCls`。
 *    产物里的类是 `apollo-tabs-switch-appear` 等；写成 `apollo-switch` 会**静默失效**
 *    （PITFALLS 180 同族：动效名写错不报错，只是没动画）。
 */

import { isPlainObject } from '@apollo-design/utils';
import type { TabsAnimatedConfig } from '../interface';

/** 三种 `animated` 输入归一后的形状。 */
export interface MergedAnimatedConfig extends TabsAnimatedConfig {
  inkBar: boolean;
  tabPane: boolean;
  /** 仅 `tabPane` 为真时存在（rc 的 `tabPaneMotion`）。 */
  tabPaneMotion?: {
    motionAppear: boolean;
    motionEnter: boolean;
    motionLeave: boolean;
    motionName: string;
  };
}

/** 面板动画的基础开关（上游的 `motion` 常量）。 */
const TAB_PANE_MOTION = {
  motionAppear: false,
  motionEnter: true,
  motionLeave: true,
} as const;

/**
 * 归一 `animated`。
 *
 * **纯函数**（不读 props、不碰 DOM）⇒ L1 可以穷举全部分支（`docs/analysis/tabs.md` R12）。
 */
export function getAnimateConfig(
  prefixCls: string,
  animated: boolean | TabsAnimatedConfig | undefined = {
    inkBar: true,
    tabPane: false,
  },
): MergedAnimatedConfig {
  let merged: MergedAnimatedConfig;

  if (animated === false) {
    merged = { inkBar: false, tabPane: false };
  } else if (animated === true) {
    merged = { inkBar: true, tabPane: true };
  } else {
    merged = {
      inkBar: true,
      ...(isPlainObject(animated) ? animated : {}),
    } as MergedAnimatedConfig;
  }

  if (merged.tabPane) {
    merged.tabPaneMotion = {
      ...TAB_PANE_MOTION,
      motionName: `${prefixCls}-switch`,
    };
  }

  return merged;
}
