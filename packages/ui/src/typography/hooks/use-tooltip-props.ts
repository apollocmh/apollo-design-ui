/**
 * `useTooltipProps` —— 把 `ellipsis.tooltip` 归一化成 Tooltip 的 props。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/hooks/useTooltipProps.js`（**逐条对齐**）：
 *
 * ```js
 * if (tooltip === true)                 return { title: editConfigText ?? children };
 * if (isValidElement(tooltip))          return { title: tooltip };
 * if (isPlainObject(tooltip))           return { title: editConfigText ?? children, ...tooltip };
 * return { title: tooltip };
 * ```
 *
 * ⚠️ 四条分支的**顺序是契约**：`isPlainObject` 是宽松判定（VNode 也是对象），
 *    所以 `isValidElement` 必须在它前面 —— 否则 `tooltip={<b>x</b>}` 会被展开成一堆
 *    内部字段，而不是当成标题节点。
 *
 * ⚠️ `isPlainObject` 的宽松语义还意味着**数组会走展开分支**（`{...[]}` 得到 `{}`，
 *    `title` 保持 `editConfigText ?? children`）。这是 antd 的真实行为。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明 Tooltip **渲染**正确 —— Tooltip 组件尚未落地，本阶段只产出 `title`
 *     （`Base.vue` 用它算根元素的 `aria-label`）。缺口登记在 README §7。
 */

import { isPlainObject, isVNode } from '@apollo-design/utils';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue, type VNodeChild } from 'vue';

import type { TypographyTooltipProps } from '../interface';

export function useTooltipProps(
  tooltip: MaybeRefOrGetter<VNodeChild | TypographyTooltipProps | undefined>,
  editConfigText: MaybeRefOrGetter<VNodeChild>,
  children: MaybeRefOrGetter<VNodeChild>,
): ComputedRef<TypographyTooltipProps> {
  return computed<TypographyTooltipProps>(() => {
    const raw = toValue(tooltip);
    const editText = toValue(editConfigText);
    const kids = toValue(children);

    if (raw === true) {
      return { title: editText ?? kids };
    }
    if (isVNode(raw)) {
      return { title: raw };
    }
    if (isPlainObject(raw)) {
      return { title: editText ?? kids, ...(raw as TypographyTooltipProps) };
    }
    // ⚠️ 走到这里 `raw` 的类型仍是 `VNodeChild | TypographyTooltipProps` —— 类型守卫
    //    的**否定分支**不会排除 `TypographyTooltipProps`（它是对象，`isPlainObject`
    //    为真，但 TS 无法从「不是 `Record<string, unknown>`」反推）。
    //    运行期这是 `tooltip` 的其余取值：字符串 / 数字 / `null` / `undefined`。
    return { title: raw as VNodeChild };
  });
}
