/**
 * `Timeline` 的项转换（对应上游 `es/timeline/useItems.tsx`，99 行）。
 *
 * 把 `items`（或废弃的 `children` / `pending`）规整成 `Steps` 能吃的 `StepItem[]`。
 *
 * ── 六条必须复刻的判据 ───────────────────────────────────────────────────────
 *
 * 1. **字段别名**：`title ?? label`、`content ?? children`、`icon ?? dot`（`??` 不是 `||`）。
 * 2. **`placement` 的推导链**：`placement ?? position ?? (mode === 'alternate'
 *    ? (index % 2 === 0 ? 'start' : 'end') : mode)` —— ⚠️ `alternate` 时按**奇偶**交替。
 * 3. **`-placement-{x}` 类恒定附加**（推导出来的值也会落类）。
 * 4. 🚨 **`color` 的两条分支**：命中 `['blue','red','green','gray']` ⇒ 加类
 *    `${itemCls}-color-${color}`；**否则**把色值写进内联 CSS 变量
 *    `${varName('item-icon-dot-color')}`（即 `--{rootPrefixCls}-cmp-steps-item-icon-dot-color`）。
 *    ⚠️ 任意色值那条分支**同时保留用户自己的 `style`**（`{...新增, ...style}` —— style 在后）。
 * 5. **`status: loading ? 'process' : 'finish'`** —— 每项**恒有** status（不是可选）。
 * 6. **`loading` 且无 `icon`/`dot` ⇒ 默认 `LoadingOutlined`**。
 *
 * ── 与上游的两处**平台差异**（PLATFORM）───────────────────────────────────────
 *
 * - Native content slots are evaluated by Timeline during render after this
 *   pure data conversion. No React element/children parsing or empty Item shell.
 * - **`pending` 的默认图标**：上游用 `@ant-design/icons` 的 `LoadingOutlined`；
 *   本仓用 `@apollo-design/icons` 的同名组件（形状一致，D14 家族）。
 */

import { LoadingOutlined } from '@apollo-design/icons';
import { h, type VNodeChild } from 'vue';
import type { StepItem } from '../steps/interface';
import type { ItemPlacement, TimelineItemType, TimelineMode } from './interface';

/** 预设色 —— 命中则落类，否则走内联 CSS 变量。 */
const PRESET_COLORS = ['blue', 'red', 'green', 'gray'];

/** `clsx` 的等价物：过滤假值后空格连接。 */
const clsx = (...values: unknown[]): string =>
  values.filter((value) => typeof value === 'string' && value !== '').join(' ');

/** Legacy positions name the same two sides; CSS consumes only start/end. */
function placementOf(position: TimelineMode | undefined, index: number): ItemPlacement {
  if (position === 'end' || position === 'right') return 'end';
  return position === 'alternate' && index % 2 === 1 ? 'end' : 'start';
}

export interface UseItemsContext {
  /** ConfigProvider 的根前缀（`apollo`）。 */
  rootPrefixCls: string;
  /** 组件前缀（`apollo-timeline`）。 */
  prefixCls: string;
  /** 已归一的 mode。 */
  mode: TimelineMode;
}

/**
 * 把 `items` + 废弃的 `pending` / `pendingDot` 规整成 `StepItem[]`。
 *
 * ⚠️ 这是**纯函数**（上游是 hook，但逻辑上没有响应式依赖之外的副作用）
 * ⇒ 便于 L1 直接对拍，不需要挂载。
 */
export function useItems(
  ctx: UseItemsContext,
  items?: TimelineItemType[],
  pending?: VNodeChild,
  pendingDot?: VNodeChild,
): StepItem[] {
  const { rootPrefixCls, prefixCls, mode } = ctx;
  const itemCls = `${prefixCls}-item`;
  /** Steps 的中间变量名（与 `style/context.ts` 的 `sv` 同一套命名）。 */
  const varName = (name: string): string => `--${rootPrefixCls}-cmp-steps-${name}`;

  const mergedItems: StepItem[] = (items ?? []).map<StepItem>((item, index) => {
    const {
      label,
      children,
      title,
      content,
      color,
      className,
      classNames,
      styles,
      style,
      icon,
      dot,
      placement,
      position,
      loading,
    } = item;

    let mergedStyle = style;
    let mergedClassName = className;

    // 判据 4：预设色落类；任意色值落内联变量（且用户 style 覆盖新增项）
    if (color) {
      if (PRESET_COLORS.includes(color)) {
        mergedClassName = clsx(className, `${itemCls}-color-${color}`);
      } else {
        mergedStyle = { [varName('item-icon-dot-color')]: color, ...style };
      }
    }

    // 判据 2：placement 的推导链
    const mergedPlacement = placement ?? placementOf(position ?? mode, index);

    mergedClassName = clsx(mergedClassName, `${itemCls}-placement-${mergedPlacement}`);

    // 判据 6：loading 且无 icon/dot ⇒ 默认加载图标
    let mergedIcon = icon ?? dot;
    if (mergedIcon == null && loading) {
      mergedIcon = h(LoadingOutlined);
    }

    return {
      key: item.key,
      title: title ?? label,
      content: content ?? children,
      style: mergedStyle,
      className: mergedClassName,
      classNames,
      styles,
      icon: mergedIcon,
      // 判据 5：恒有 status
      status: loading ? 'process' : 'finish',
    };
  });

  // 废弃的 `pending` ⇒ 追加一项（⚠️ 这一项**没有** className / placement）
  if (pending !== undefined && pending !== null && pending !== false) {
    // Keep the synthetic entry distinct from numeric fallback and user keys.
    const keys = new Set(mergedItems.map((item) => item.key));
    let key = 'apollo-timeline-pending';
    while (keys.has(key)) key += '-pending';
    mergedItems.push({
      key,
      icon: pendingDot ?? h(LoadingOutlined),
      content: pending,
      status: 'process',
    });
  }

  return mergedItems;
}
