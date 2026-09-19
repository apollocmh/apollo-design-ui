/**
 * `EllipsisTooltip` —— 省略号真的截断了时的悬浮提示。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Base/EllipsisTooltip.js`（**逐条对齐**）：
 *
 * ```jsx
 * if (!tooltipProps?.title || !enableEllipsis) {
 *   return children;
 * }
 * return <Tooltip {...tooltipProps} disabled={!isEllipsis || disabled}>{children}</Tooltip>;
 * ```
 *
 * ── ⚠️ 本阶段它是**直通**的（占位），这是有意为之 ──────────────────────────────
 *
 * `Tooltip` 组件尚未落地（不在本组件的依赖里，见 `registry/components.json` 的
 * `dependencies.components: []`）。两条分支在**当前**的 DOM 上是等价的：
 * rc-tooltip 未展开时只渲染 children，不产生任何包裹元素（这一点已被 antd 的
 * SSR 输出证实 —— 见 `tests/compat/baselines/typography.dom.json`）。
 *
 * 所以这里直接返回 children。**保留这个组件与它的四个 props 不是为了「以后可能有用」**，
 * 而是因为它们是**上游的组件边界**：`isMergedEllipsis`（原生省略号是否真的截断）
 * 与 `isHoveringOperations`（鼠标是否停在操作区，用于避免提示挡住按钮）这两条
 * 判定链在 `Base` 里是**完整实现**的，只是消费点在 Tooltip 里。Tooltip 落地时
 * 只需要改本文件的渲染体，`Base` 一行都不用动。
 *
 * 登记为 D-typography-8（与 `CopyBtn` / 编辑按钮不包 Tooltip 是同一条）。
 *
 * ── 这个组件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明悬浮提示本身 —— 它现在什么都不做。`tooltipProps.title` 的**唯一**
 *     现时可观测产物是 `Base` 根元素的 `aria-label`（`topAriaLabel`），
 *     那条路径是完整且被测试覆盖的。
 */

import { defineComponent, type PropType } from 'vue';

import type { TypographyTooltipProps } from './interface';

export const EllipsisTooltip = defineComponent({
  name: 'ATypographyEllipsisTooltip',
  props: {
    /** `mergedEnableEllipsis`。为假时提示没有意义。 */
    enableEllipsis: { type: Boolean, default: undefined },
    /** `isMergedEllipsis`：原生省略号**真的**截断了。为假时提示不弹出。 */
    isEllipsis: { type: Boolean, default: undefined },
    /** 鼠标停在操作区时为真 ⇒ 提示不弹出（否则会挡住按钮）。 */
    disabled: { type: Boolean, default: undefined },
    /** 已归一化的 Tooltip props（`{ title, ... }`）。 */
    tooltipProps: { type: Object as PropType<TypographyTooltipProps>, default: undefined },
  },
  setup(_props, { slots }) {
    return () => {
      const children = slots.default?.() ?? [];
      // ⚠️ 单个孩子要**原样返回**，不能返回数组：数组会被 Vue 当作 Fragment 根，
      //    组件的 `$el` 就不再是那个元素（`wrapper.classes()` / `wrapper.attributes()`
      //    这类断言会拿到容器而失效）。antd 的 `return children` 也是单个 React 元素。
      return children.length === 1 ? children[0] : children;
    };
  },
});
