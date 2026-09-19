/**
 * `CopyBtn` —— `copyable` 的按钮。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Base/CopyBtn.js`（**逐条对齐**）。
 *
 * ```jsx
 * <Tooltip title={copyTitle}>
 *   <button type="button" class="{prefixCls}-copy [className] [-copy-success] [-copy-icon-only]"
 *           style={style} onClick={onCopy} aria-label={ariaLabel} tabIndex={tabIndex}>
 *     {copied ? (icon[1] ?? <CheckOutlined/>)
 *             : (icon[0] ?? (loading ? <LoadingOutlined/> : <CopyOutlined/>))}
 *   </button>
 * </Tooltip>
 * ```
 *
 * ── 三处必须保留的判据 ────────────────────────────────────────────────────────
 *
 *   1. **`aria-label` 的兜底顺序**：`typeof copyTitle === 'string' ? copyTitle : systemStr`。
 *      也就是说 `tooltips` 给的是节点（非字符串）时，`aria-label` 退回语言包文案 ——
 *      而不是空字符串。可访问名必须有内容。
 *   2. **`iconOnly` 只看 children 是否可渲染**（`isReactRenderable`）。它不是
 *      「按钮里没有图标」，而是「文字内容为空、只有图标」⇒ 加 `-copy-icon-only`
 *      让 CSS 用更小的点击热区。判据来自 `Base`，本组件只负责落类名。
 *   3. **`copied` 分支的 `needDom` 是 `true`**：`icon: false` 在「已复制」态下
 *      **仍然渲染默认的 `CheckOutlined`**（`false || (true && <CheckOutlined/>)`），
 *      而在「未复制」态下渲染 `false`（什么都不画）。这是 `getNode` 的既定行为，
 *      不是笔误。
 *
 * ── 与 antd 的一处差异（INTENDED，见 README §7）─────────────────────────────────
 *
 * antd 用 `<Tooltip>` 包住按钮提供悬浮提示。**Tooltip 组件尚未落地**，这里不包 ——
 * DOM 上等价（rc-tooltip 在未展开时只渲染 children，SSR 输出完全相同），
 * `tooltips` 的文案仍然完整地参与 `aria-label` 的计算。
 * 登记为 D-typography-8。
 *
 * ── 为什么是 `.ts` 渲染函数而不是 `.vue` ────────────────────────────────────────
 *
 * 「渲染一个 `VNodeChild` 变量」在模板里没有直接语法（`{{ x }}` 会把 VNode
 * JSON 化，`<component :is="x">` 只接受组件/标签名）。而本组件的图标恰恰是一个
 * `VNodeChild`（可能是用户给的节点、`false`、或内置图标组件）。这是
 * COMPONENT-RULES.md §2 允许 `.ts` 渲染函数的第 1 条情形（纯渲染函数内部组件）。
 */

import { CheckOutlined, CopyOutlined, LoadingOutlined } from '@apollo-design/icons';
import type { TextLocale } from '@apollo-design/locale';
import { type CSSProperties, defineComponent, h, type PropType, type VNodeChild } from 'vue';

import { type CopyConfigListNode, getNode, toCopyConfigList } from './_util/util';

export const CopyBtn = defineComponent({
  name: 'ATypographyCopyBtn',
  props: {
    prefixCls: { type: String, required: true },
    /** 是否处于「已复制」态。 */
    copied: { type: Boolean, default: undefined },
    /** 语言包。取 `copy` / `copied` 作为 `aria-label` 的兜底。 */
    locale: { type: Object as PropType<TextLocale>, default: undefined },
    /** 内容为空（只有图标）⇒ 加 `-copy-icon-only`。 */
    iconOnly: { type: Boolean, default: undefined },
    /** 悬浮提示。`[未复制, 已复制]`。 */
    tooltips: { type: null as unknown as PropType<CopyConfigListNode>, default: undefined },
    /** 图标。`[未复制, 已复制]`。 */
    icon: { type: null as unknown as PropType<CopyConfigListNode>, default: undefined },
    tabIndex: { type: Number, default: undefined },
    onCopy: { type: Function as PropType<(e?: MouseEvent) => void>, default: undefined },
    /** 剪贴板写入进行中（决定未复制态用 `LoadingOutlined` 还是 `CopyOutlined`）。 */
    loading: { type: Boolean, default: undefined },
    /** 语义化 `action` 类名（由 `Base` 合并后传入）。 */
    className: { type: String, default: undefined },
    /** 语义化 `action` 样式（由 `Base` 合并后传入）。 */
    style: { type: Object as PropType<CSSProperties>, default: undefined },
  },
  setup(props) {
    return () => {
      const tooltipNodes = toCopyConfigList(props.tooltips);
      const iconNodes = toCopyConfigList(props.icon);

      const copiedText = props.locale?.copied;
      const copyText = props.locale?.copy;
      const systemStr: VNodeChild = props.copied ? copiedText : copyText;

      const copyTitle = getNode(tooltipNodes[props.copied ? 1 : 0], systemStr);
      const ariaLabel = typeof copyTitle === 'string' ? copyTitle : systemStr;

      const iconNode: VNodeChild = props.copied
        ? getNode(iconNodes[1], h(CheckOutlined), true)
        : getNode(iconNodes[0], props.loading ? h(LoadingOutlined) : h(CopyOutlined), true);

      return h(
        'button',
        {
          type: 'button',
          class: [
            `${props.prefixCls}-copy`,
            props.className,
            {
              [`${props.prefixCls}-copy-success`]: props.copied,
              [`${props.prefixCls}-copy-icon-only`]: props.iconOnly,
            },
          ],
          style: props.style,
          onClick: props.onCopy,
          'aria-label': ariaLabel,
          tabIndex: props.tabIndex,
        },
        [iconNode],
      );
    };
  },
});
